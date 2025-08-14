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

    // Check if user has permission to view recent applications
    if (session.user.role !== "LOAN_OFFICER" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const applications = await db.loanApplication.findMany({
      take: 5,
      where: { status: { in: ["PENDING", "ADDITIONAL_INFO_REQUESTED"] } },
      orderBy: { createdAt: "desc" },
      include: {
        applicant: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    const recentApplications = applications.map(app => ({
      id: app.id,
      name: `${app.applicant.firstName} ${app.applicant.lastName}`,
      amount: `₦${app.amount.toLocaleString()}`,
      purpose: app.purpose || "Not specified",
      submitted: new Date(app.createdAt).toLocaleDateString(),
      priority: app.status === "ADDITIONAL_INFO_REQUESTED" ? "High" : "Medium"
    }))

    return NextResponse.json(recentApplications)
  } catch (error) {
    console.error("Error fetching recent applications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}