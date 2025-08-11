import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { LoanApplicationStatus } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "LOAN_OFFICER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { recommendation, notes } = await request.json()

    if (!recommendation || !["APPROVE", "REJECT", "REQUEST_MORE_INFO"].includes(recommendation)) {
      return NextResponse.json(
        { error: "Invalid recommendation" },
        { status: 400 }
      )
    }

    // Check if application exists and is in reviewable state
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

    if (application.status !== LoanApplicationStatus.SUBMITTED && 
        application.status !== LoanApplicationStatus.UNDER_REVIEW) {
      return NextResponse.json(
        { error: "Application is not in a reviewable state" },
        { status: 400 }
      )
    }

    // Check if all required documents are approved
    const pendingDocuments = application.documents.filter(doc => doc.status === "PENDING")
    if (pendingDocuments.length > 0 && recommendation === "APPROVE") {
      return NextResponse.json(
        { error: "All documents must be reviewed before approving the application" },
        { status: 400 }
      )
    }

    // Update application status based on recommendation
    let newStatus: LoanApplicationStatus
    switch (recommendation) {
      case "APPROVE":
        newStatus = LoanApplicationStatus.APPROVED
        break
      case "REJECT":
        newStatus = LoanApplicationStatus.REJECTED
        break
      case "REQUEST_MORE_INFO":
        newStatus = LoanApplicationStatus.UNDER_REVIEW
        break
      default:
        newStatus = LoanApplicationStatus.UNDER_REVIEW
    }

    // Create loan review record
    const loanReview = await db.loanReview.create({
      data: {
        loanApplicationId: params.id,
        reviewerId: session.user.id,
        recommendation: recommendation as any,
        notes: notes || "",
        status: "COMPLETED"
      }
    })

    // Update application status
    const updatedApplication = await db.loanApplication.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        reviewedById: session.user.id,
        reviewedAt: new Date()
      }
    })

    // Create notification for applicant
    await db.notification.create({
      data: {
        userId: application.applicantId,
        title: "Application Review Update",
        message: `Your loan application has been ${recommendation.toLowerCase()} by the loan officer.`,
        type: "APPLICATION_UPDATE",
        loanApplicationId: params.id
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "APPLICATION_REVIEWED",
        entityType: "LoanApplication",
        entityId: params.id,
        userId: session.user.id,
        details: {
          oldStatus: application.status,
          newStatus,
          recommendation,
          notes
        }
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