import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { LoanStatus, NotificationType } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "LOAN_OFFICER" && session.user.role !== "APPROVER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { decision, comments, reviewType } = await request.json()

    if (!decision || !["APPROVED", "REJECTED", "REQUEST_INFO"].includes(decision)) {
      return NextResponse.json(
        { error: "Invalid decision" },
        { status: 400 }
      )
    }

    // Check if application exists
    const application = await db.loanApplication.findUnique({
      where: { id: params.id },
      include: {
        applicant: true,
        documents: true
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: "Loan application not found" },
        { status: 404 }
      )
    }

    // Check if application is in reviewable state
    if (session.user.role === "LOAN_OFFICER" && application.status !== LoanStatus.PENDING) {
      return NextResponse.json(
        { error: "Application is not in a reviewable state for loan officer" },
        { status: 400 }
      )
    }

    if (session.user.role === "APPROVER" && application.status !== LoanStatus.UNDER_REVIEW) {
      return NextResponse.json(
        { error: "Application is not in a reviewable state for approver" },
        { status: 400 }
      )
    }

    // Update application status based on decision
    let newStatus: LoanStatus
    switch (decision) {
      case "APPROVED":
        newStatus = session.user.role === "APPROVER" ? LoanStatus.APPROVED : LoanStatus.UNDER_REVIEW
        break
      case "REJECTED":
        newStatus = LoanStatus.REJECTED
        break
      case "REQUEST_INFO":
        newStatus = LoanStatus.ADDITIONAL_INFO_REQUESTED
        break
      default:
        newStatus = application.status
    }

    // Create loan review record
    const loanReview = await db.loanReview.create({
      data: {
        applicationId: params.id,
        reviewerId: session.user.id,
        reviewType: reviewType || (session.user.role === "APPROVER" ? "APPROVER_REVIEW" : "OFFICER_REVIEW"),
        status: decision,
        comments: comments || "",
        recommendation: decision
      }
    })

    // Update application status
    const updatedApplication = await db.loanApplication.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        ...(decision === "APPROVED" && session.user.role === "APPROVER" && { approvedAt: new Date() }),
        ...(decision === "REJECTED" && { rejectedAt: new Date() }),
        ...(decision === "REQUEST_INFO" && { additionalInfoRequested: comments })
      }
    })

    // Create notification for applicant
    await db.notification.create({
      data: {
        userId: application.applicantId,
        type: decision === "APPROVED" ? NotificationType.APPLICATION_APPROVED :
              decision === "REJECTED" ? NotificationType.APPLICATION_REJECTED :
              NotificationType.ADDITIONAL_INFO_REQUESTED,
        title: "Application Review Update",
        message: `Your loan application has been ${decision.toLowerCase()} by the ${session.user.role.toLowerCase()}.`,
        loanApplicationId: params.id
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "APPLICATION_REVIEWED",
        entityType: "LoanApplication",
        entityId: params.id,
        oldValues: JSON.stringify({
          status: application.status
        }),
        newValues: JSON.stringify({
          status: newStatus,
          decision,
          comments
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }
    })

    return NextResponse.json({
      message: "Review submitted successfully",
      application: updatedApplication,
      review: loanReview
    })
  } catch (error) {
    console.error("Error submitting review:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}