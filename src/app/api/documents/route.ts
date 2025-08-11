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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const loanApplicationId = formData.get("loanApplicationId") as string
    const documentType = formData.get("documentType") as DocumentType

    if (!file || !loanApplicationId || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

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

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads", "documents")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file
    await writeFile(filePath, buffer)

    // Save document record to database
    const document = await db.document.create({
      data: {
        fileName: file.name,
        filePath: `/uploads/documents/${fileName}`,
        fileType: file.type,
        fileSize: file.size,
        documentType,
        status: DocumentStatus.PENDING,
        loanApplicationId,
        uploadedById: session.user.id
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "DOCUMENT_UPLOADED",
        entityType: "Document",
        entityId: document.id,
        userId: session.user.id,
        details: {
          fileName: file.name,
          documentType,
          loanApplicationId
        }
      }
    })

    return NextResponse.json({
      message: "Document uploaded successfully",
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        documentType: document.documentType,
        status: document.status,
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