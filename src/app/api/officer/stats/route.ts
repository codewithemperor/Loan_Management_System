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

    // Check if user has permission to view officer stats
    if (session.user.role !== "LOAN_OFFICER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [pending, reviewedToday, needAttention, approvedCount] = await Promise.all([
      db.loanApplication.count({ 
        where: { 
          status: "PENDING",
          assignedOfficerId: session.user.id
        } 
      }),
      db.loanReview.count({ 
        where: { 
          reviewerId: session.user.id,
          reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      db.loanApplication.count({ 
        where: { 
          status: "ADDITIONAL_INFO_REQUESTED",
          assignedOfficerId: session.user.id
        } 
      }),
      db.loanReview.count({ 
        where: { 
          reviewerId: session.user.id,
          status: "APPROVED"
        }
      })
    ])

    const totalReviewed = await db.loanReview.count({ 
      where: { 
        reviewerId: session.user.id
      }
    })
    
    const approvalRate = totalReviewed > 0 ? Math.round((approvedCount / totalReviewed) * 100) : 0

    const stats = {
      pending,
      reviewedToday,
      needAttention,
      approvalRate
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching officer stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}