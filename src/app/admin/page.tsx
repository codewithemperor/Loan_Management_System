"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Users, FileText, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"

export default function AdminDashboard() {
  return (
    <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with AOPE Credit today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">856</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,345</div>
              <p className="text-xs text-muted-foreground">
                +15% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦45,231</div>
              <p className="text-xs text-muted-foreground">
                +20% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>
                Latest loan applications submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "John Doe", amount: "₦500,000", status: "Pending", time: "2 hours ago" },
                  { name: "Jane Smith", amount: "₦1,000,000", status: "Under Review", time: "5 hours ago" },
                  { name: "Mike Johnson", amount: "₦200,000", status: "Approved", time: "1 day ago" },
                  { name: "Sarah Williams", amount: "₦750,000", status: "Rejected", time: "2 days ago" },
                ].map((application, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{application.name}</p>
                      <p className="text-sm text-muted-foreground">{application.amount}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        application.status === "Approved" ? "bg-green-100 text-green-800" :
                        application.status === "Rejected" ? "bg-red-100 text-red-800" :
                        application.status === "Under Review" ? "bg-yellow-100 text-yellow-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {application.status}
                      </div>
                      <p className="text-xs text-muted-foreground">{application.time}</p>
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
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Manage Users</p>
                    <p className="text-sm text-muted-foreground">Add or remove system users</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Review Applications</p>
                    <p className="text-sm text-muted-foreground">Check pending applications</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">System Alerts</p>
                    <p className="text-sm text-muted-foreground">View system notifications</p>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Generate Reports</p>
                    <p className="text-sm text-muted-foreground">Create system reports</p>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}