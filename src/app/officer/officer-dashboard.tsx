import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle, AlertTriangle, Eye, Edit } from "lucide-react"
import Link from "next/link"

async function getOfficerStats() {
  try {
    const [pending, reviewedToday, needAttention, totalReviewed] = await Promise.all([
      db.loanApplication.count({ where: { status: "PENDING" } }),
      db.loanApplication.count({ 
        where: { 
          status: { in: ["UNDER_REVIEW", "APPROVED", "REJECTED"] },
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      db.loanApplication.count({ where: { status: "NEEDS_ATTENTION" } }),
      db.loanApplication.count({ where: { status: "APPROVED" } })
    ])

    const totalApplications = await db.loanApplication.count()
    const approvalRate = totalApplications > 0 ? Math.round((totalReviewed / totalApplications) * 100) : 0

    return {
      pending,
      reviewedToday,
      needAttention,
      approvalRate
    }
  } catch (error) {
    console.error("Error fetching officer stats:", error)
    return {
      pending: 0,
      reviewedToday: 0,
      needAttention: 0,
      approvalRate: 0
    }
  }
}

async function getRecentApplications() {
  try {
    const applications = await db.loanApplication.findMany({
      take: 5,
      where: { status: { in: ["PENDING", "NEEDS_ATTENTION"] } },
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

    return applications.map(app => ({
      id: app.id,
      name: `${app.applicant.firstName} ${app.applicant.lastName}`,
      amount: `₦${app.amount.toLocaleString()}`,
      purpose: app.purpose || "Not specified",
      submitted: new Date(app.createdAt).toLocaleDateString(),
      priority: app.status === "NEEDS_ATTENTION" ? "High" : "Medium"
    }))
  } catch (error) {
    console.error("Error fetching recent applications:", error)
    return []
  }
}

export async function OfficerDashboard() {
  const stats = await getOfficerStats()
  const recentApplications = await getRecentApplications()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Loan Officer Dashboard</h1>
        <p className="text-muted-foreground">
          Manage and review loan applications for AOPE Credit.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Applications awaiting review
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewedToday}</div>
            <p className="text-xs text-muted-foreground">
              Applications processed today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.needAttention}</div>
            <p className="text-xs text-muted-foreground">
              Require additional information
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">
              This month's approval rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Applications for Review</CardTitle>
                <CardDescription>
                  Loan applications requiring your attention
                </CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/officer/applications">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.length > 0 ? recentApplications.map((application, index) => (
                <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium leading-none">{application.name}</p>
                      <Badge variant={
                        application.priority === "High" ? "destructive" :
                        application.priority === "Medium" ? "secondary" :
                        "outline"
                      }>
                        {application.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{application.amount} • {application.purpose}</p>
                    <p className="text-xs text-muted-foreground">Submitted {application.submitted}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/officer/applications/${application.id}/review`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/officer/applications/${application.id}/review`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Review
                      </Link>
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  No applications requiring review
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common loan officer tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/officer/applications" className="block">
              <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium">Review Applications</p>
                    <p className="text-sm text-muted-foreground">Check pending applications</p>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link href="/officer/review" className="block">
              <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium">My Reviews</p>
                    <p className="text-sm text-muted-foreground">View your review history</p>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div className="text-left">
                  <p className="font-medium">Pending Tasks</p>
                  <p className="text-sm text-muted-foreground">{stats.pending} applications need attention</p>
                </div>
              </div>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div className="text-left">
                  <p className="font-medium">Alerts</p>
                  <p className="text-sm text-muted-foreground">{stats.needAttention} urgent notifications</p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}