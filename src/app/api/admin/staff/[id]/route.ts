import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to update staff
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { isActive } = body

    // Check if staff member exists
    const staff = await db.user.findUnique({
      where: { id: params.id }
    })

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Update staff member
    const updatedStaff = await db.user.update({
      where: { id: params.id },
      data: {
        isActive
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_STAFF_STATUS",
        entityType: "User",
        entityId: params.id,
        oldValues: JSON.stringify({
          isActive: staff.isActive
        }),
        newValues: JSON.stringify({
          isActive: updatedStaff.isActive
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({
      message: "Staff member updated successfully",
      staff: updatedStaff
    })
  } catch (error) {
    console.error("Error updating staff:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}