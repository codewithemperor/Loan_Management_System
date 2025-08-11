import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { LoanStatus, DocumentType, NotificationType } from "@prisma/client"
import { writeFile } from "fs/promises"
import path from "path"
import { z } from "zod"

const loanApplicationSchema = z.object({
  amount: z.number(),
  purpose: z.string(),
  duration: z.number(),
  monthlyIncome: z.number(),
  employmentStatus: z.enum(["EMPLOYED", "SELF_EMPLOYED", "UNEMPLOYED", "RETIRED", "STUDENT"]),
  employerName: z.string().optional(),
  workExperience: z.number().optional(),
  phoneNumber: z.string(),
  address: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "APPLICANT" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    
    // Extract form data
    const applicationData = {
      amount: parseFloat(formData.get("amount") as string),
      purpose: formData.get("purpose") as string,
      duration: parseInt(formData.get("duration") as string),
      monthlyIncome: parseFloat(formData.get("monthlyIncome") as string),
      employmentStatus: formData.get("employmentStatus") as string,
      employerName: formData.get("employerName") as string || null,
      workExperience: formData.get("workExperience") ? parseInt(formData.get("workExperience") as string) : null,
      phoneNumber: formData.get("phoneNumber") as string,
      address: formData.get("address") as string,
    }

    // Validate input
    const validatedData = loanApplicationSchema.parse(applicationData)

    // Create loan application
    const loanApplication = await db.loanApplication.create({
      data: {
        applicantId: session.user.id,
        amount: validatedData.amount,
        purpose: validatedData.purpose,
        duration: validatedData.duration,
        interestRate: 15.5, // Default interest rate
        monthlyIncome: validatedData.monthlyIncome,
        employmentStatus: validatedData.employmentStatus,
        employerName: validatedData.employerName,
        workExperience: validatedData.workExperience,
        status: LoanStatus.PENDING,
      },
    })

    // Handle document uploads
    const documentTypes = [
      { id: "id_card", type: DocumentType.ID_CARD },
      { id: "passport", type: DocumentType.PASSPORT },
      { id: "bank_statement", type: DocumentType.BANK_STATEMENT },
      { id: "pay_slip", type: DocumentType.PAY_SLIP },
      { id: "utility_bill", type: DocumentType.UTILITY_BILL },
      { id: "business_registration", type: DocumentType.BUSINESS_REGISTRATION },
    ]

    const uploadedDocuments = []

    for (const docType of documentTypes) {
      const file = formData.get(`documents_${docType.id}`) as File | null
      
      if (file && file.size > 0) {
        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "public", "uploads", "documents")
        await writeFile(path.join(uploadDir, `${loanApplication.id}_${docType.id}_${file.name}`), Buffer.from(await file.arrayBuffer()))
        
        const document = await db.document.create({
          data: {
            applicationId: loanApplication.id,
            type: docType.type,
            fileName: file.name,
            filePath: `/uploads/documents/${loanApplication.id}_${docType.id}_${file.name}`,
            fileSize: file.size,
            mimeType: file.type,
          },
        })
        
        uploadedDocuments.push(document)
      }
    }

    // Create notification for loan officers
    const loanOfficers = await db.user.findMany({
      where: {
        role: "LOAN_OFFICER",
        isActive: true,
      },
    })

    for (const officer of loanOfficers) {
      await db.notification.create({
        data: {
          userId: officer.id,
          type: NotificationType.APPLICATION_SUBMITTED,
          title: "New Loan Application",
          message: `A new loan application for ₦${validatedData.amount.toLocaleString()} has been submitted.`,
          loanApplicationId: loanApplication.id,
        },
      })
    }

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBMIT_APPLICATION",
        entityType: "LoanApplication",
        entityId: loanApplication.id,
        newValues: JSON.stringify({
          amount: validatedData.amount,
          purpose: validatedData.purpose,
          duration: validatedData.duration,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({
      message: "Loan application submitted successfully",
      applicationId: loanApplication.id,
      documentsUploaded: uploadedDocuments.length,
    })
  } catch (error) {
    console.error("Error creating loan application:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")

    const skip = (page - 1) * limit

    // Build where clause based on user role
    let whereClause: any = {}
    
    if (session.user.role === "APPLICANT") {
      whereClause.applicantId = session.user.id
    } else if (session.user.role === "LOAN_OFFICER") {
      // Loan officers can see applications assigned to them or all pending applications
      whereClause.OR = [
        { status: LoanStatus.PENDING },
        { status: LoanStatus.UNDER_REVIEW },
        { reviews: { some: { reviewerId: session.user.id } } }
      ]
    } else if (session.user.role === "APPROVER") {
      // Approvers can see applications that have been reviewed by officers
      whereClause.status = { in: [LoanStatus.UNDER_REVIEW, LoanStatus.ADDITIONAL_INFO_REQUESTED] }
    }
    // Super admins can see all applications

    if (status) {
      whereClause.status = status
    }

    const [applications, total] = await Promise.all([
      db.loanApplication.findMany({
        where: whereClause,
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
          documents: {
            select: {
              id: true,
              type: true,
              fileName: true,
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
        orderBy: {
          submittedAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.loanApplication.count({ where: whereClause }),
    ])

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching loan applications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}