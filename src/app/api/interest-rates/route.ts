import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const skip = (page - 1) * limit

    const [interestRates, total] = await Promise.all([
      db.interestRate.findMany({
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { months: "asc" },
        skip,
        take: limit,
      }),
      db.interestRate.count(),
    ])

    return NextResponse.json({
      interestRates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching interest rates:", error)
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

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { months, rate } = body

    if (!months || !rate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (months < 1 || months > 60) {
      return NextResponse.json({ error: "Months must be between 1 and 60" }, { status: 400 })
    }

    if (rate < 0 || rate > 100) {
      return NextResponse.json({ error: "Rate must be between 0 and 100" }, { status: 400 })
    }

    // Check if rate for this duration already exists
    const existingRate = await db.interestRate.findFirst({
      where: {
        months,
        adminId: session.user.id,
      },
    })

    if (existingRate) {
      // Update existing rate
      const updatedRate = await db.interestRate.update({
        where: { id: existingRate.id },
        data: {
          rate,
          isActive: true,
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return NextResponse.json({
        message: "Interest rate updated successfully",
        interestRate: updatedRate,
      })
    }

    // Create new interest rate
    const interestRate = await db.interestRate.create({
      data: {
        months,
        rate,
        adminId: session.user.id,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Interest rate created successfully",
      interestRate,
    })
  } catch (error) {
    console.error("Error creating interest rate:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}