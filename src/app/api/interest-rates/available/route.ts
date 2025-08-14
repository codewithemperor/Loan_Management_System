import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const interestRates = await db.interestRate.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        months: "asc",
      },
      select: {
        months: true,
        rate: true,
      },
    })

    return NextResponse.json({
      interestRates,
    })
  } catch (error) {
    console.error("Error fetching available interest rates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}