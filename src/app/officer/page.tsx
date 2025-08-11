"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle, AlertTriangle, Eye, Edit } from "lucide-react"
import Link from "next/link"

export default function OfficerDashboard() {
  return (
    <DashboardLayout requiredRoles={[UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN]}>
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
              <div className="text-2xl font-bold">23</div>
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
              <div className="text-2xl font-bold">8</div>
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
              <div className="text-2xl font-bold">5</div>
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
              <div className="text-2xl font-bold">78%</div>
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
                {[
                  { 
                    id: "1",
                    name: "John Doe", 
                    amount: "₦500,000", 
                    purpose: "Business expansion", 
                    submitted: "2 hours ago",
                    priority: "High"
                  },
                  { 
                    id: "2",
                    name: "Jane Smith", 
                    amount: "₦1,000,000", 
                    purpose: "Home renovation", 
                    submitted: "5 hours ago",
                    priority: "Medium"
                  },
                  { 
                    id: "3",
                    name: "Mike Johnson", 
                    amount: "₦200,000", 
                    purpose: "Emergency medical", 
                    submitted: "1 day ago",
                    priority: "High"
                  },
                  { 
                    id: "4",
                    name: "Sarah Williams", 
                    amount: "₦750,000", 
                    purpose: "Education fees", 
                    submitted: "2 days ago",
                    priority: "Low"
                  },
                ].map((application, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium leading-none">{application.name}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          application.priority === "High" ? "bg-red-100 text-red-800" :
                          application.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {application.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{application.amount} • {application.purpose}</p>
                      <p className="text-xs text-muted-foreground">Submitted {application.submitted}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/officer/review?id=${application.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/officer/review?id=${application.id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Review
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
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
                <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Review Applications</p>
                      <p className="text-sm text-muted-foreground">Check pending applications</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/officer/reviews" className="block">
                <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">My Reviews</p>
                      <p className="text-sm text-muted-foreground">View your review history</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Pending Tasks</p>
                    <p className="text-sm text-muted-foreground">5 applications need attention</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Alerts</p>
                    <p className="text-sm text-muted-foreground">2 urgent notifications</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}