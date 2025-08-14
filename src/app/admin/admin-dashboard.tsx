"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Users, FileText, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AdminStats {
  totalApplications: number
  activeLoans: number
  totalUsers: number
  revenue: number
}

interface RecentApplication {
  id: string
  name: string
  amount: string
  status: string
  time: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalApplications: 0,
    activeLoans: 0,
    totalUsers: 0,
    revenue: 0
  })
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, recentResponse] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/recent-applications")
        ])

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        if (recentResponse.ok) {
          const recentData = await recentResponse.json()
          setRecentApplications(recentData)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
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
            <div className="text-2xl font-bold">{stats.totalApplications.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{stats.activeLoans.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">₦{stats.revenue.toLocaleString()}</div>
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
              {recentApplications.length > 0 ? recentApplications.map((application, index) => (
                <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{application.name}</p>
                    <p className="text-sm text-muted-foreground">{application.amount}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={
                      application.status === "APPROVED" ? "default" :
                      application.status === "REJECTED" ? "destructive" :
                      application.status === "UNDER_REVIEW" ? "secondary" :
                      "outline"
                    }>
                      {application.status.replace("_", " ")}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{application.time}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent applications found
                </div>
              )}
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
            <Link href="/admin/users">
              <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium">Manage Users</p>
                    <p className="text-sm text-muted-foreground">Add or remove system users</p>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link href="/officer/applications">
              <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium">Review Applications</p>
                    <p className="text-sm text-muted-foreground">Check pending applications</p>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div className="text-left">
                  <p className="font-medium">System Alerts</p>
                  <p className="text-sm text-muted-foreground">View system notifications</p>
                </div>
              </div>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <div className="text-left">
                  <p className="font-medium">Generate Reports</p>
                  <p className="text-sm text-muted-foreground">Create system reports</p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}