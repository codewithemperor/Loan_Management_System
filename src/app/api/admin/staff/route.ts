import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view staff
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const roleFilter = searchParams.get("roleFilter")
    const status = searchParams.get("status")
    const roles = searchParams.get("role")?.split(",") || ["LOAN_OFFICER", "APPROVER", "SUPER_ADMIN"]

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      role: { in: roles }
    }

    if (roleFilter && roleFilter !== "all") {
      where.role = roleFilter
    }

    if (status === "active") {
      where.isActive = true
    } else if (status === "inactive") {
      where.isActive = false
    }

    const [staff, total] = await Promise.all([
      db.user.findMany({
        where,
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
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      db.user.count({ where })
    ])

    const staffWithNames = staff.map(user => ({
      ...user,
      name: user.name || `${user.firstName} ${user.lastName}`
    }))

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      staff: staffWithNames,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to create staff
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, phoneNumber, address, password } = body

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Generate a temporary password
    const tempPassword = password || Math.random().toString(36).slice(-8)

    // Split name into first and last name
    const nameParts = name.trim().split(" ")
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ")

    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create new staff member
    const newStaff = await db.user.create({
      data: {
        email,
        firstName,
        lastName,
        name,
        password: hashedPassword,
        role: role as UserRole,
        phoneNumber,
        address,
        isActive: true,
        emailVerified: false
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
        action: "CREATE_STAFF",
        entityType: "User",
        entityId: newStaff.id,
        oldValues: null,
        newValues: JSON.stringify({
          email: newStaff.email,
          name: newStaff.name,
          role: newStaff.role
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    return NextResponse.json({
      message: "Staff member created successfully",
      staff: newStaff,
      tempPassword // In production, send this via email
    })
  } catch (error) {
    console.error("Error creating staff:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}