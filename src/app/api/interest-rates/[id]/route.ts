import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const interestRateId = params.id

    // Check if the interest rate exists
    const existingRate = await db.interestRate.findUnique({
      where: { id: interestRateId }
    })

    if (!existingRate) {
      return NextResponse.json({ error: "Interest rate not found" }, { status: 404 })
    }

    // Delete the interest rate
    await db.interestRate.delete({
      where: { id: interestRateId }
    })

    return NextResponse.json({
      message: "Interest rate deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting interest rate:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}