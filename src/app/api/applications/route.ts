import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { LoanStatus, DocumentType, NotificationType, IdCardType } from "@prisma/client"
import { z } from "zod"
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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

// Helper function to upload file to Cloudinary
async function uploadToCloudinary(file: File, folder: string = "loan_documents"): Promise<any> {
  try {
    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto", // Automatically detect file type
          allowed_formats: ["jpg", "jpeg", "png", "pdf"],
          max_file_size: 10000000, // 10MB limit
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      ).end(buffer)
    })
  } catch (error) {
    console.error("Error preparing file for upload:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Loan Application Submission Started ===")
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log("No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "APPLICANT" && session.user.role !== "SUPER_ADMIN") {
      console.log("User role not authorized:", session.user.role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log("User authorized:", session.user.id, session.user.role)

    const formData = await request.formData()
    console.log("Form data received, keys:", Array.from(formData.keys()))
    
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

    console.log("Application data extracted:", {
      amount: applicationData.amount,
      duration: applicationData.duration,
      employmentStatus: applicationData.employmentStatus,
    })

    // Extract document files
    const idCardFile = formData.get("idCard") as File | null
    const proofOfFundsFile = formData.get("proofOfFunds") as File | null
    const idCardType = formData.get("idCardType") as IdCardType || null

    console.log("Files extracted:", {
      idCardFile: idCardFile ? { name: idCardFile.name, size: idCardFile.size } : null,
      proofOfFundsFile: proofOfFundsFile ? { name: proofOfFundsFile.name, size: proofOfFundsFile.size } : null,
      idCardType
    })

    // Validate input
    const validatedData = loanApplicationSchema.parse(applicationData)
    console.log("Data validation passed")

    // Validate required documents
    if (!idCardFile || !proofOfFundsFile || !idCardType) {
      console.log("Missing required documents or ID card type")
      return NextResponse.json({ error: "Both ID card and proof of funds are required" }, { status: 400 })
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Missing Cloudinary configuration")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
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
      console.log("Assigned loan officer:", randomOfficer.name)
    } else {
      console.log("No active loan officers found")
    }

    // Check applicant exists
    const applicantExists = await db.user.findUnique({
      where: { id: session.user.id },
    });
    if (!applicantExists) {
      throw new Error(`Applicant with id ${session.user.id} not found`);
    }

    // Check officer exists (if assigned)
    if (assignedOfficerId) {
      const officerExists = await db.user.findUnique({
        where: { id: assignedOfficerId },
      });
      if (!officerExists) {
        throw new Error(`Loan officer with id ${assignedOfficerId} not found`);
      }
    }


    // Create loan application first
    console.log("Creating loan application in database...")
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

    console.log("Loan application created with ID:", loanApplication.id)

    const uploadedDocuments = []

    try {
      console.log("Starting document uploads...")

      // Upload ID Card to Cloudinary
      console.log("Uploading ID card...")
      const idCardCloudinaryData = await uploadToCloudinary(idCardFile, "loan_documents/id_cards")
      console.log("ID card uploaded successfully:", idCardCloudinaryData.secure_url)

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
      console.log("ID card document record created")

      // Upload Proof of Funds to Cloudinary
      console.log("Uploading proof of funds...")
      const proofOfFundsCloudinaryData = await uploadToCloudinary(proofOfFundsFile, "loan_documents/proof_of_funds")
      console.log("Proof of funds uploaded successfully:", proofOfFundsCloudinaryData.secure_url)

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
      console.log("Proof of funds document record created")

    } catch (uploadError) {
      console.error("Document upload failed:", uploadError)
      
      // Clean up the loan application if document upload fails
      try {
        await db.loanApplication.delete({ where: { id: loanApplication.id } })
        console.log("Cleaned up loan application due to upload failure")
      } catch (cleanupError) {
        console.error("Failed to cleanup loan application:", cleanupError)
      }
      
      return NextResponse.json(
        { error: uploadError instanceof Error ? uploadError.message : "Failed to upload documents" },
        { status: 500 }
      )
    }

    // Create notification for the assigned loan officer
    if (assignedOfficerId) {
      try {
        await db.notification.create({
          data: {
            userId: assignedOfficerId,
            type: NotificationType.APPLICATION_SUBMITTED,
            title: "New Loan Application Assigned",
            message: `A new loan application for ₦${validatedData.amount.toLocaleString()} has been assigned to you.`,
            loanApplicationId: loanApplication.id,
          },
        })
        console.log("Notification created for loan officer")
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError)
        // Don't fail the entire request for notification errors
      }
    }

    // Log the action
    try {
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
      console.log("Audit log created")
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError)
      // Don't fail the entire request for audit log errors
    }

    console.log("=== Loan Application Submission Completed Successfully ===")

    return NextResponse.json({
      message: "Loan application submitted successfully",
      applicationId: loanApplication.id,
      documentsUploaded: uploadedDocuments.length,
    })
  } catch (error) {
    console.error("Error creating loan application:", error)
    
    if (error instanceof z.ZodError) {
      console.log("Validation errors:", error.errors)
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