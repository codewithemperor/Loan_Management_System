import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { readFile, unlink } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { DocumentStatus } from "@prisma/client"
import { existsSync } from "fs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const document = await db.document.findUnique({
      where: { id: params.id },
      include: {
        loanApplication: {
          include: { applicant: true }
        }
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if user has access to this document
    if (session.user.role !== "SUPER_ADMIN" && 
        session.user.role !== "LOAN_OFFICER" && 
        session.user.role !== "APPROVER" &&
        document.loanApplication.applicantId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this document" },
        { status: 403 }
      )
    }

    // Read file from disk
    const filePath = path.join(process.cwd(), document.filePath)
    const fileBuffer = await readFile(filePath)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": document.fileType,
        "Content-Disposition": `attachment; filename="${document.fileName}"`,
        "Content-Length": document.fileSize.toString()
      }
    })
  } catch (error) {
    console.error("Error downloading document:", error)
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

    const { status, notes } = await request.json()

    if (!status || !Object.values(DocumentStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid document status" },
        { status: 400 }
      )
    }

    // Only officers and approvers can update document status
    if (session.user.role !== "LOAN_OFFICER" && 
        session.user.role !== "APPROVER" && 
        session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized to update document status" },
        { status: 403 }
      )
    }

    const document = await db.document.findUnique({
      where: { id: params.id },
      include: { loanApplication: true }
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    const updatedDocument = await db.document.update({
      where: { id: params.id },
      data: {
        status,
        notes: notes || document.notes,
        reviewedById: session.user.id,
        reviewedAt: new Date()
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "DOCUMENT_STATUS_UPDATED",
        entityType: "Document",
        entityId: document.id,
        userId: session.user.id,
        details: {
          oldStatus: document.status,
          newStatus: status,
          notes,
          loanApplicationId: document.loanApplicationId
        }
      }
    })

    return NextResponse.json({
      message: "Document status updated successfully",
      document: updatedDocument
    })
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const document = await db.document.findUnique({
      where: { id: params.id },
      include: {
        loanApplication: {
          include: { applicant: true }
        }
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if user can delete this document
    const canDelete = 
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "APPLICANT" && document.uploadedById === session.user.id) ||
      (session.user.role === "LOAN_OFFICER" && document.loanApplication.status === "DRAFT")

    if (!canDelete) {
      return NextResponse.json(
        { error: "Unauthorized to delete this document" },
        { status: 403 }
      )
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), document.filePath)
    if (existsSync(filePath)) {
      await unlink(filePath)
    }

    // Delete document record from database
    await db.document.delete({
      where: { id: params.id }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "DOCUMENT_DELETED",
        entityType: "Document",
        entityId: document.id,
        userId: session.user.id,
        details: {
          fileName: document.fileName,
          loanApplicationId: document.loanApplicationId
        }
      }
    })

    return NextResponse.json({
      message: "Document deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}