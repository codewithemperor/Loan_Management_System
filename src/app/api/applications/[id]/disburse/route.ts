import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Function to calculate monthly payment using simple interest (matches your frontend calculation)
function calculateLoanDetails(amount: number, annualRate: number, duration: number) {
  const totalInterest = amount * (annualRate / 100);
  const totalRepayment = amount + totalInterest;
  const monthlyPayment = totalRepayment / duration;
  
  return {
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100
  };
}

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

    if (application.status !== "APPROVED" && application.status !== "DISBURSED" ) {
      return NextResponse.json({ error: "Application must be approved before disbursement" }, { status: 400 })
    }

    if (application.status === "DISBURSED") {
      return NextResponse.json({ error: "Loan has already been disbursed" }, { status: 400 })
    }

    // If loan doesn't exist, create one
    let loan = application.loan;
    if (!loan) {
      const loanDetails = calculateLoanDetails(
        application.amount,
        application.interestRate,
        application.duration
      );

      // Calculate next payment due (1 month from disbursement)
      const nextPaymentDue = new Date();
      nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);

      loan = await db.loan.create({
        data: {
          applicationId: id,
          approvedAmount: application.amount,
          disbursementAmount: application.amount, // Assuming full amount is disbursed
          interestRate: application.interestRate,
          duration: application.duration,
          monthlyPayment: loanDetails.monthlyPayment,
          totalRepayment: loanDetails.totalRepayment,
          disbursementDate: new Date(),
          bankAccount: application.accountNumber || null,
          bankName: application.bankName || null,
          nextPaymentDue,
          createdBy: session.user.id,
        }
      });
    } else {
      // Update existing loan with disbursement date
      loan = await db.loan.update({
        where: { id: loan.id },
        data: {
          disbursementDate: new Date(),
          nextPaymentDue: loan.nextPaymentDue || (() => {
            const nextPaymentDue = new Date();
            nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);
            return nextPaymentDue;
          })()
        }
      });
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
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        loan: true
      },
    })

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
      message: `Loan of ₦${application.amount.toLocaleString()} has been successfully disbursed to ${updatedApplication.applicant.firstName} ${updatedApplication.applicant.lastName}`,
      application: updatedApplication,
      loan: loan
    })
  } catch (error) {
    console.error("Error disbursing loan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}