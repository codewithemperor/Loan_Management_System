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

    // Check if user has permission to view pending applications
    if (session.user.role !== "APPROVER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const applications = await db.loanApplication.findMany({
      take: 5,
      where: { status: "UNDER_REVIEW" },
      orderBy: { createdAt: "desc" },
      include: {
        applicant: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        reviews: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    const pendingApplications = applications.map(app => ({
      id: app.id,
      name: `${app.applicant.firstName} ${app.applicant.lastName}`,
      amount: `₦${app.amount.toLocaleString()}`,
      purpose: app.purpose || "Not specified",
      officer: app.reviews[0]?.reviewer ? 
        `${app.reviews[0].reviewer.firstName} ${app.reviews[0].reviewer.lastName}` : 
        "Unknown",
      risk: app.amount > 500000 ? "High" : app.amount > 200000 ? "Medium" : "Low",
      recommended: app.reviews[0]?.status === "APPROVED" ? "Approve" : 
                 app.reviews[0]?.status === "REJECTED" ? "Reject" : "Pending"
    }))

    return NextResponse.json(pendingApplications)
  } catch (error) {
    console.error("Error fetching pending applications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}