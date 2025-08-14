"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, CreditCard, Eye, ThumbsUp, ThumbsDown } from "lucide-react"
import Link from "next/link"

interface ApproverStats {
  pending: number
  approvedToday: number
  rejectedToday: number
  totalApprovedAmount: number
}

interface PendingApplication {
  id: string
  name: string
  amount: string
  purpose: string
  officer: string
  risk: string
  recommended: string
}

export default function ApproverDashboard() {
  const [stats, setStats] = useState<ApproverStats>({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalApprovedAmount: 0
  })
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, pendingResponse] = await Promise.all([
          fetch("/api/approver/stats"),
          fetch("/api/approver/pending")
        ])

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json()
          setPendingApplications(pendingData)
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
        <h1 className="text-3xl font-bold tracking-tight">Approver Dashboard</h1>
        <p className="text-muted-foreground">
          Review and approve loan applications for AOPE Credit.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your decision
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground">
              Loans approved today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedToday}</div>
            <p className="text-xs text-muted-foreground">
              Applications rejected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(stats.totalApprovedAmount / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">
              Total amount approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Applications for Approval */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Applications for Approval</CardTitle>
                <CardDescription>
                  Loan applications ready for your approval
                </CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/approver/pending">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApplications.length > 0 ? pendingApplications.map((application, index) => (
                <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium leading-none">{application.name}</p>
                      <Badge variant={
                        application.risk === "High" ? "destructive" :
                        application.risk === "Medium" ? "secondary" :
                        "outline"
                      }>
                        {application.risk} Risk
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{application.amount} • {application.purpose}</p>
                    <p className="text-xs text-muted-foreground">Reviewed by {application.officer}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium">Recommendation:</span>
                      <Badge variant={
                        application.recommended === "Approve" ? "default" :
                        application.recommended === "Reject" ? "destructive" :
                        "secondary"
                      }>
                        {application.recommended}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/approver/applications/${application.id}/review`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" asChild>
                      <Link href={`/approver/applications/${application.id}/review`}>
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Approve
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" asChild>
                      <Link href={`/approver/applications/${application.id}/review`}>
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Reject
                      </Link>
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  No applications pending approval
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common approver tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/approver/pending" className="block">
              <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium">Pending Approvals</p>
                    <p className="text-sm text-muted-foreground">{stats.pending} applications waiting</p>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link href="/approver/approved" className="block">
              <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium">Approved Loans</p>
                    <p className="text-sm text-muted-foreground">View approved applications</p>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link href="/approver/rejected" className="block">
              <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div className="text-left">
                    <p className="font-medium">Rejected Applications</p>
                    <p className="text-sm text-muted-foreground">View rejected applications</p>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-purple-500" />
                <div className="text-left">
                  <p className="font-medium">Disbursement Queue</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.approvedToday} loans ready for disbursement
                  </p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}