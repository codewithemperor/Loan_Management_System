import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const application = await db.loanApplication.findUnique({
      where: { id: params.id },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            address: true,
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            reviewedAt: "desc",
          },
        },
        loan: {
          select: {
            id: true,
            approvedAmount: true,
            disbursementAmount: true,
            monthlyPayment: true,
            disbursementDate: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Check if user has permission to view this application
    if (session.user.role === "APPLICANT" && application.applicantId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { accountNumber, bankName, bvn, nin } = body

    // Check if application exists
    const application = await db.loanApplication.findUnique({
      where: { id: params.id },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Check permissions - only applicant can update their own account details
    if (session.user.role === "APPLICANT" && application.applicantId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update application with account details
    const updatedApplication = await db.loanApplication.update({
      where: { id: params.id },
      data: {
        ...(accountNumber && { accountNumber }),
        ...(bankName && { bankName }),
        ...(bvn && { bvn }),
        ...(nin && { nin }),
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

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_APPLICATION_ACCOUNT_DETAILS",
        entityType: "LoanApplication",
        entityId: params.id,
        oldValues: JSON.stringify({
          accountNumber: application.accountNumber,
          bankName: application.bankName,
          bvn: application.bvn,
          nin: application.nin,
        }),
        newValues: JSON.stringify({
          accountNumber: updatedApplication.accountNumber,
          bankName: updatedApplication.bankName,
          bvn: updatedApplication.bvn,
          nin: updatedApplication.nin,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({
      message: "Account details updated successfully",
      application: updatedApplication,
    })
  } catch (error) {
    console.error("Error updating application account details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, additionalInfoRequested } = body

    // Check if application exists
    const application = await db.loanApplication.findUnique({
      where: { id: params.id },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === "APPLICANT" && application.applicantId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update application
    const updatedApplication = await db.loanApplication.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(additionalInfoRequested && { additionalInfoRequested }),
        ...(additionalInfoRequested && { additionalInfoProvided: null }), // Reset provided info when new info is requested
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

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_APPLICATION",
        entityType: "LoanApplication",
        entityId: params.id,
        oldValues: JSON.stringify({
          status: application.status,
          additionalInfoRequested: application.additionalInfoRequested,
        }),
        newValues: JSON.stringify({
          status: updatedApplication.status,
          additionalInfoRequested: updatedApplication.additionalInfoRequested,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({
      message: "Application updated successfully",
      application: updatedApplication,
    })
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}