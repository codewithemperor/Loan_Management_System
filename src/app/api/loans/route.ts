import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const skip = (page - 1) * limit

    // Build where clause based on user role
    let whereClause: any = {}
    
    if (session.user.role === "APPLICANT") {
      whereClause.application = {
        applicantId: session.user.id
      }
    } else if (session.user.role === "LOAN_OFFICER") {
      // Loan officers can see loans they created or applications they reviewed
      whereClause.OR = [
        { createdBy: session.user.id },
        { application: { reviews: { some: { reviewerId: session.user.id } } } }
      ]
    }
    // Super admins and approvers can see all loans

    const [loans, total] = await Promise.all([
      db.loan.findMany({
        where: whereClause,
        include: {
          application: {
            include: {
              applicant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.loan.count({ where: whereClause }),
    ])

    return NextResponse.json({
      loans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching loans:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["SUPER_ADMIN", "LOAN_OFFICER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { applicationId, approvedAmount, disbursementAmount, interestRate, duration, monthlyPayment, bankAccount, bankName } = body

    // Validate required fields
    if (!applicationId || !approvedAmount || !interestRate || !duration || !monthlyPayment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if application exists and is approved
    const application = await db.loanApplication.findUnique({
      where: { id: applicationId },
      include: { loan: true }
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    if (application.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Application must be approved before creating loan" },
        { status: 400 }
      )
    }

    if (application.loan) {
      return NextResponse.json(
        { error: "Loan already exists for this application" },
        { status: 400 }
      )
    }

    // Create loan
    const loan = await db.loan.create({
      data: {
        applicationId,
        approvedAmount,
        disbursementAmount: disbursementAmount || approvedAmount,
        interestRate,
        duration,
        monthlyPayment,
        bankAccount,
        bankName,
        createdBy: session.user.id,
      },
    })

    // Update application status
    await db.loanApplication.update({
      where: { id: applicationId },
      data: { status: "DISBURSED" },
    })

    // Create notification for applicant
    await db.notification.create({
      data: {
        userId: application.applicantId,
        type: "LOAN_DISBURSED",
        title: "Loan Disbursed",
        message: `Your loan of ₦${disbursementAmount?.toLocaleString() || approvedAmount.toLocaleString()} has been disbursed.`,
        loanApplicationId: applicationId,
      },
    })

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_LOAN",
        entityType: "Loan",
        entityId: loan.id,
        newValues: JSON.stringify({
          applicationId,
          approvedAmount,
          disbursementAmount,
          interestRate,
          duration,
          monthlyPayment,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({
      message: "Loan created successfully",
      loan,
    })
  } catch (error) {
    console.error("Error creating loan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}