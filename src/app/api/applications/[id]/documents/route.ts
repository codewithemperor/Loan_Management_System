import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DocumentType, IdCardType } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const loanApplicationId = params.id

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

    const formData = await request.formData()
    const idCardFile = formData.get("idCard") as File
    const proofOfFundsFile = formData.get("proofOfFunds") as File
    const idCardType = formData.get("idCardType") as IdCardType

    if (!idCardFile || !proofOfFundsFile || !idCardType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if documents already exist for this application
    const existingIdCard = await db.document.findFirst({
      where: {
        applicationId: loanApplicationId,
        type: DocumentType.ID_CARD
      }
    })

    const existingProofOfFunds = await db.document.findFirst({
      where: {
        applicationId: loanApplicationId,
        type: DocumentType.PROOF_OF_FUNDS
      }
    })

    if (existingIdCard || existingProofOfFunds) {
      return NextResponse.json({ error: "Documents already uploaded for this application" }, { status: 400 })
    }

    // Create Cloudinary upload signature
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration is missing")
    }

    const uploadedDocuments = []

    // Upload ID Card
    try {
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
          applicationId: loanApplicationId,
          type: DocumentType.ID_CARD,
          fileName: idCardFile.name,
          filePath: idCardCloudinaryData.secure_url,
          fileSize: idCardFile.size,
          mimeType: idCardFile.type,
          idCardType: idCardType
        }
      })

      uploadedDocuments.push(idCardDocument)
    } catch (error) {
      console.error("Error uploading ID card:", error)
      // Clean up any uploaded documents if one fails
      for (const doc of uploadedDocuments) {
        await db.document.delete({ where: { id: doc.id } })
      }
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to upload ID card" },
        { status: 500 }
      )
    }

    // Upload Proof of Funds
    try {
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
          applicationId: loanApplicationId,
          type: DocumentType.PROOF_OF_FUNDS,
          fileName: proofOfFundsFile.name,
          filePath: proofOfFundsCloudinaryData.secure_url,
          fileSize: proofOfFundsFile.size,
          mimeType: proofOfFundsFile.type
        }
      })

      uploadedDocuments.push(proofOfFundsDocument)
    } catch (error) {
      console.error("Error uploading proof of funds:", error)
      // Clean up any uploaded documents if one fails
      for (const doc of uploadedDocuments) {
        await db.document.delete({ where: { id: doc.id } })
      }
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to upload proof of funds" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Documents uploaded successfully",
      documents: uploadedDocuments
    })
  } catch (error) {
    console.error("Error uploading documents:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload documents" },
      { status: 500 }
    )
  }
}