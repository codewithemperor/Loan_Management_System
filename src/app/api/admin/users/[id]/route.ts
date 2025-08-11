import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            loanApplications: true,
            reviews: true,
            createdLoans: true,
            notifications: true,
            auditLogs: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user:", error)
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

    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, phoneNumber, address, isActive } = body

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is being changed and already exists
    if (email && email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        )
      }
    }

    // Prevent deactivating the last super admin
    if (existingUser.role === UserRole.SUPER_ADMIN && isActive === false) {
      const superAdminCount = await db.user.count({
        where: {
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
      })

      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot deactivate the last super admin" },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        address: true,
        isActive: true,
        emailVerified: true,
        updatedAt: true,
      },
    })

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_USER",
        entityType: "User",
        entityId: params.id,
        oldValues: JSON.stringify({
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          phoneNumber: existingUser.phoneNumber,
          address: existingUser.address,
          isActive: existingUser.isActive,
        }),
        newValues: JSON.stringify({
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phoneNumber: updatedUser.phoneNumber,
          address: updatedUser.address,
          isActive: updatedUser.isActive,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error updating user:", error)
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

    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            loanApplications: true,
            reviews: true,
            createdLoans: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deleting super admin
    if (user.role === UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Cannot delete super admin user" },
        { status: 400 }
      )
    }

    // Prevent deleting users with active loans or applications
    if (user._count.loanApplications > 0 || user._count.createdLoans > 0) {
      return NextResponse.json(
        { error: "Cannot delete user with active loans or applications" },
        { status: 400 }
      )
    }

    // Delete user
    await db.user.delete({
      where: { id: params.id },
    })

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_USER",
        entityType: "User",
        entityId: params.id,
        oldValues: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}