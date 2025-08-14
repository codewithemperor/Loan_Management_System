import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { LoanStatus, DocumentType, NotificationType, IdCardType } from "@prisma/client"
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
  accountNumber: z.string(),
  bankName: z.string(),
  bvn: z.string().optional(),
  nin: z.string().optional(),
  interestRate: z.number(),
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
      accountNumber: formData.get("accountNumber") as string,
      bankName: formData.get("bankName") as string,
      bvn: formData.get("bvn") as string || null,
      nin: formData.get("nin") as string || null,
      interestRate: parseFloat(formData.get("interestRate") as string),
    }

    // Extract document files
    const idCardFile = formData.get("idCard") as File | null
    const proofOfFundsFile = formData.get("proofOfFunds") as File | null
    const idCardType = formData.get("idCardType") as IdCardType || null

    // Validate input
    const validatedData = loanApplicationSchema.parse(applicationData)

    // Validate required documents
    if (!idCardFile || !proofOfFundsFile || !idCardType) {
      return NextResponse.json({ error: "Both ID card and proof of funds are required" }, { status: 400 })
    }

    // Get a random loan officer for assignment
    const loanOfficers = await db.user.findMany({
      where: {
        role: "LOAN_OFFICER",
        isActive: true,
      },
    })

    let assignedOfficerId = null
    if (loanOfficers.length > 0) {
      const randomOfficer = loanOfficers[Math.floor(Math.random() * loanOfficers.length)]
      assignedOfficerId = randomOfficer.id
    }

    // Create Cloudinary upload signature
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration is missing")
    }

    // Create loan application first
    const loanApplication = await db.loanApplication.create({
      data: {
        applicantId: session.user.id,
        amount: validatedData.amount,
        purpose: validatedData.purpose,
        duration: validatedData.duration,
        interestRate: validatedData.interestRate,
        monthlyIncome: validatedData.monthlyIncome,
        employmentStatus: validatedData.employmentStatus,
        employerName: validatedData.employerName,
        workExperience: validatedData.workExperience,
        phoneNumber: validatedData.phoneNumber,
        address: validatedData.address,
        accountNumber: validatedData.accountNumber,
        bankName: validatedData.bankName,
        bvn: validatedData.bvn,
        nin: validatedData.nin,
        status: LoanStatus.PENDING,
        assignedOfficerId,
      },
    })

    const uploadedDocuments = []

    try {
      // Upload ID Card to Cloudinary
      const idCardFormData = new FormData()
      idCardFormData.append("file", idCardFile)
      idCardFormData.append("upload_preset", uploadPreset)
      idCardFormData.append("folder", "loan_documents")

      const idCardResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: idCardFormData,
        }
      )

      if (!idCardResponse.ok) {
        const errorData = await idCardResponse.json()
        throw new Error(errorData.error?.message || "Failed to upload ID card")
      }

      const idCardCloudinaryData = await idCardResponse.json()

      // Save ID card metadata to database
      const idCardDocument = await db.document.create({
        data: {
          applicationId: loanApplication.id,
          type: DocumentType.ID_CARD,
          fileName: idCardFile.name,
          filePath: idCardCloudinaryData.secure_url,
          fileSize: idCardFile.size,
          mimeType: idCardFile.type,
          idCardType: idCardType
        }
      })

      uploadedDocuments.push(idCardDocument)

      // Upload Proof of Funds to Cloudinary
      const proofOfFundsFormData = new FormData()
      proofOfFundsFormData.append("file", proofOfFundsFile)
      proofOfFundsFormData.append("upload_preset", uploadPreset)
      proofOfFundsFormData.append("folder", "loan_documents")

      const proofOfFundsResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: proofOfFundsFormData,
        }
      )

      if (!proofOfFundsResponse.ok) {
        const errorData = await proofOfFundsResponse.json()
        throw new Error(errorData.error?.message || "Failed to upload proof of funds")
      }

      const proofOfFundsCloudinaryData = await proofOfFundsResponse.json()

      // Save proof of funds metadata to database
      const proofOfFundsDocument = await db.document.create({
        data: {
          applicationId: loanApplication.id,
          type: DocumentType.PROOF_OF_FUNDS,
          fileName: proofOfFundsFile.name,
          filePath: proofOfFundsCloudinaryData.secure_url,
          fileSize: proofOfFundsFile.size,
          mimeType: proofOfFundsFile.type
        }
      })

      uploadedDocuments.push(proofOfFundsDocument)

    } catch (uploadError) {
      // Clean up the loan application if document upload fails
      await db.loanApplication.delete({ where: { id: loanApplication.id } })
      console.error("Document upload failed:", uploadError)
      return NextResponse.json(
        { error: uploadError instanceof Error ? uploadError.message : "Failed to upload documents" },
        { status: 500 }
      )
    }

    // Create notification for the assigned loan officer
    if (assignedOfficerId) {
      await db.notification.create({
        data: {
          userId: assignedOfficerId,
          type: NotificationType.APPLICATION_SUBMITTED,
          title: "New Loan Application Assigned",
          message: `A new loan application for ₦${validatedData.amount.toLocaleString()} has been assigned to you.`,
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
          accountNumber: validatedData.accountNumber,
          bankName: validatedData.bankName,
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
      { error: error instanceof Error ? error.message : "Internal server error" },
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
      // Loan officers can only see applications assigned to them
      whereClause.assignedOfficerId = session.user.id
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
          assignedOfficer: {
            select: {
              id: true,
              name: true,
              email: true,
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