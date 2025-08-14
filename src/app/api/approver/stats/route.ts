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

    // Check if user has permission to view approver stats
    if (session.user.role !== "APPROVER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [pending, approvedToday, rejectedToday, totalApprovedAmount] = await Promise.all([
      db.loanApplication.count({ where: { status: "UNDER_REVIEW" } }),
      db.loanApplication.count({ 
        where: { 
          status: "APPROVED",
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      db.loanApplication.count({ 
        where: { 
          status: "REJECTED",
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      db.loan.aggregate({
        _sum: { amount: true },
        where: { status: "APPROVED" }
      })
    ])

    const stats = {
      pending,
      approvedToday,
      rejectedToday,
      totalApprovedAmount: totalApprovedAmount._sum.amount || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching approver stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}