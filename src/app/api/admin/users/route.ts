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

    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    const skip = (page - 1) * limit

    // Build where clause
    let whereClause: any = {}
    
    if (role) {
      whereClause.role = role
    }
    
    if (status === "active") {
      whereClause.isActive = true
    } else if (status === "inactive") {
      whereClause.isActive = false
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
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
          // Count related entities
          _count: {
            select: {
              loanApplications: true,
              reviews: true,
              createdLoans: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.user.count({ where: whereClause }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
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

    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, phoneNumber, address } = body

    // Validate input
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        role,
        phoneNumber,
        address,
        password: hashedPassword,
        isActive: true,
        emailVerified: false,
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
        createdAt: true,
      },
    })

    // Log the action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_USER",
        entityType: "User",
        entityId: user.id,
        newValues: JSON.stringify({
          name,
          email,
          role,
          phoneNumber,
          address,
        }),
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    // In a real application, you would send an email here with the temporary password
    // For now, we'll just return it in the response
    return NextResponse.json({
      message: "User created successfully",
      user,
      temporaryPassword: tempPassword,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}