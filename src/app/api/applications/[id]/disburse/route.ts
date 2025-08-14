import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to disburse loans
    if (session.user.role !== "APPROVER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Check if application exists and is approved
    const application = await db.loanApplication.findUnique({
      where: { id },
      include: {
        applicant: true,
        loan: true
      }
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (application.status !== "APPROVED") {
      return NextResponse.json({ error: "Application must be approved before disbursement" }, { status: 400 })
    }

    if (application.status === "DISBURSED") {
      return NextResponse.json({ error: "Loan has already been disbursed" }, { status: 400 })
    }

    // Update application status to disbursed
    const updatedApplication = await db.loanApplication.update({
      where: { id },
      data: {
        status: "DISBURSED",
        disbursedAt: new Date()
      },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // If loan exists, update disbursement date
    if (application.loan) {
      await db.loan.update({
        where: { id: application.loan.id },
        data: {
          disbursementDate: new Date()
        }
      })
    }

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DISBURSE_LOAN",
        entityType: "LoanApplication",
        entityId: id,
        oldValues: JSON.stringify({
          status: application.status,
          disbursedAt: application.disbursedAt,
        }),
        newValues: JSON.stringify({
          status: updatedApplication.status,
          disbursedAt: updatedApplication.disbursedAt,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    // Create notification for applicant
    await db.notification.create({
      data: {
        userId: application.applicantId,
        type: "LOAN_DISBURSED",
        title: "Loan Disbursed",
        message: `Your loan of ₦${application.amount.toLocaleString()} has been disbursed to your account.`,
        loanApplicationId: id,
      },
    })

    return NextResponse.json({
      message: "Loan disbursed successfully",
      application: updatedApplication,
    })
  } catch (error) {
    console.error("Error disbursing loan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}