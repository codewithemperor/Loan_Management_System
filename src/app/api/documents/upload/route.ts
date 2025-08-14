import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DocumentType, IdCardType } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const documentType = formData.get("documentType") as DocumentType
    const idCardType = formData.get("idCardType") as IdCardType
    const loanApplicationId = formData.get("loanApplicationId") as string

    if (!file || !documentType || !loanApplicationId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the loan application belongs to the current user
    const loanApplication = await db.loanApplication.findUnique({
      where: { id: loanApplicationId }
    })

    if (!loanApplication) {
      return NextResponse.json({ error: "Loan application not found" }, { status: 404 })
    }

    if (loanApplication.applicantId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if document of this type already exists for this application
    const existingDocument = await db.document.findFirst({
      where: {
        applicationId: loanApplicationId,
        type: documentType
      }
    })

    if (existingDocument) {
      return NextResponse.json({ error: "Document of this type already exists" }, { status: 400 })
    }

    // Create Cloudinary upload signature
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration is missing")
    }

    const uploadFormData = new FormData()
    uploadFormData.append("file", file)
    uploadFormData.append("upload_preset", uploadPreset)
    uploadFormData.append("folder", "loan_documents")

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || "Failed to upload document")
    }

    const cloudinaryData = await response.json()

    // Save document metadata to database
    const document = await db.document.create({
      data: {
        applicationId: loanApplicationId,
        type: documentType,
        fileName: file.name,
        filePath: cloudinaryData.secure_url,
        fileSize: file.size,
        mimeType: file.type,
        idCardType: documentType === DocumentType.ID_CARD ? idCardType : null
      }
    })

    return NextResponse.json({
      message: "Document uploaded successfully",
      document
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload document" },
      { status: 500 }
    )
  }
}