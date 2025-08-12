import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { DocumentType, DocumentStatus } from "@prisma/client"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if this is a Cloudinary upload (JSON payload) or traditional upload (FormData)
    const contentType = request.headers.get("content-type")
    let body
    
    if (contentType && contentType.includes("application/json")) {
      body = await request.json()
    } else {
      const formData = await request.formData()
      body = {
        file: formData.get("file"),
        loanApplicationId: formData.get("loanApplicationId"),
        documentType: formData.get("documentType")
      }
    }

    const { loanApplicationId, documentType, fileName, filePath, fileSize, mimeType, publicId } = body

    if (!loanApplicationId || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // For traditional uploads, validate file
    if (body.file) {
      const file = body.file as File
      
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ]

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only PDF, JPEG, PNG, and DOC files are allowed." },
          { status: 400 }
        )
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: "File size too large. Maximum size is 10MB." },
          { status: 400 }
        )
      }
    }

    // Verify loan application exists and belongs to user
    const loanApplication = await db.loanApplication.findUnique({
      where: { id: loanApplicationId },
      include: { applicant: true }
    })

    if (!loanApplication) {
      return NextResponse.json(
        { error: "Loan application not found" },
        { status: 404 }
      )
    }

    // Check if user owns the loan application or is an officer/admin
    if (session.user.role !== "SUPER_ADMIN" && 
        session.user.role !== "LOAN_OFFICER" && 
        session.user.role !== "APPROVER" &&
        loanApplication.applicantId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to upload documents for this application" },
        { status: 403 }
      )
    }

    let document

    // Handle Cloudinary upload (already uploaded, just save metadata)
    if (fileName && filePath && publicId) {
      document = await db.document.create({
        data: {
          applicationId: loanApplicationId,
          fileName,
          filePath,
          fileSize,
          mimeType,
          type: documentType as DocumentType
        }
      })
    } 
    // Handle traditional file upload
    else if (body.file) {
      const file = body.file as File

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), "uploads", "documents")
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      // Generate unique filename
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uniqueFileName = `${Date.now()}-${file.name}`
      const localFilePath = path.join(uploadsDir, uniqueFileName)

      // Save file
      await writeFile(localFilePath, buffer)

      // Save document record to database
      document = await db.document.create({
        data: {
          applicationId: loanApplicationId,
          fileName: file.name,
          filePath: `/uploads/documents/${uniqueFileName}`,
          fileSize: file.size,
          mimeType: file.type,
          type: documentType as DocumentType
        }
      })
    } else {
      return NextResponse.json(
        { error: "No file or Cloudinary data provided" },
        { status: 400 }
      )
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOCUMENT_UPLOADED",
        entityType: "Document",
        entityId: document.id,
        oldValues: JSON.stringify({}),
        newValues: JSON.stringify({
          fileName: document.fileName,
          type: document.type,
          loanApplicationId
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      }
    })

    return NextResponse.json({
      message: "Document uploaded successfully",
      document: {
        id: document.id,
        fileName: document.fileName,
        type: document.type,
        fileSize: document.fileSize,
        filePath: document.filePath,
        uploadedAt: document.uploadedAt
      }
    })
  } catch (error) {
    console.error("Error uploading document:", error)
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
    const loanApplicationId = searchParams.get("loanApplicationId")

    if (!loanApplicationId) {
      return NextResponse.json(
        { error: "Loan application ID is required" },
        { status: 400 }
      )
    }

    // Verify loan application exists and user has access
    const loanApplication = await db.loanApplication.findUnique({
      where: { id: loanApplicationId },
      include: { applicant: true }
    })

    if (!loanApplication) {
      return NextResponse.json(
        { error: "Loan application not found" },
        { status: 404 }
      )
    }

    // Check if user owns the loan application or is an officer/admin
    if (session.user.role !== "SUPER_ADMIN" && 
        session.user.role !== "LOAN_OFFICER" && 
        session.user.role !== "APPROVER" &&
        loanApplication.applicantId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to view documents for this application" },
        { status: 403 }
      )
    }

    const documents = await db.document.findMany({
      where: { loanApplicationId },
      orderBy: { uploadedAt: "desc" }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}