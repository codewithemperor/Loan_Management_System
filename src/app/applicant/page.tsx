"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CreditCard, Clock, CheckCircle, AlertCircle, Plus, Eye } from "lucide-react"
import Link from "next/link"

interface LoanApplication {
  id: string
  amount: number
  purpose: string
  status: string
  submittedAt: string
}

interface Loan {
  id: string
  approvedAmount: number
  monthlyPayment: number
  disbursementDate?: string
  isFullyPaid: boolean
}

interface DashboardStats {
  activeApplications: number
  activeLoans: number
  pendingApproval: number
  totalBorrowed: number
}

export default function ApplicantDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeApplications: 0,
    activeLoans: 0,
    pendingApproval: 0,
    totalBorrowed: 0
  })
  const [recentApplications, setRecentApplications] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch applications
        const applicationsResponse = await fetch('/api/applications?limit=5')
        if (!applicationsResponse.ok) {
          throw new Error("Failed to fetch applications")
        }
        const applicationsData = await applicationsResponse.json()
        
        // Fetch loans
        const loansResponse = await fetch('/api/loans')
        if (!loansResponse.ok) {
          throw new Error("Failed to fetch loans")
        }
        const loansData = await loansResponse.json()

        // Calculate stats
        const applications = applicationsData.applications || []
        const loans = loansData.loans || []
        
        const activeApplications = applications.filter(app => 
          ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUESTED'].includes(app.status)
        ).length
        
        const activeLoans = loans.filter(loan => !loan.isFullyPaid).length
        const pendingApproval = applications.filter(app => app.status === 'UNDER_REVIEW').length
        const totalBorrowed = loans.reduce((sum: number, loan: Loan) => sum + loan.approvedAmount, 0)

        setStats({
          activeApplications,
          activeLoans,
          pendingApproval,
          totalBorrowed
        })

        // Set recent applications (last 2)
        setRecentApplications(applications.slice(0, 2))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "DISBURSED":
        return "green"
      case "REJECTED":
        return "red"
      case "UNDER_REVIEW":
      case "ADDITIONAL_INFO_REQUESTED":
        return "yellow"
      case "PENDING":
        return "blue"
      default:
        return "gray"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pending"
      case "UNDER_REVIEW":
        return "Under Review"
      case "ADDITIONAL_INFO_REQUESTED":
        return "Additional Info Requested"
      case "APPROVED":
        return "Approved"
      case "REJECTED":
        return "Rejected"
      case "DISBURSED":
        return "Disbursed"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRoles={[UserRole.APPLICANT, UserRole.SUPER_ADMIN]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout requiredRoles={[UserRole.APPLICANT, UserRole.SUPER_ADMIN]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRoles={[UserRole.APPLICANT, UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applicant Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your loan applications and track their status.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeApplications}</div>
              <p className="text-xs text-muted-foreground">
                Currently being processed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLoans}</div>
              <p className="text-xs text-muted-foreground">
                Currently active loans
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApproval}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats.totalBorrowed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total amount borrowed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* My Applications */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Applications</CardTitle>
                  <CardDescription>
                    Track your loan application status
                  </CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href="/applicant/applications">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentApplications.length > 0 ? recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium leading-none">₦{application.amount.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          getStatusColor(application.status) === "green" ? "bg-green-100 text-green-800" :
                          getStatusColor(application.status) === "yellow" ? "bg-yellow-100 text-yellow-800" :
                          getStatusColor(application.status) === "red" ? "bg-red-100 text-red-800" :
                          getStatusColor(application.status) === "blue" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {getStatusLabel(application.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{application.purpose}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(application.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/applicant/applications/${application.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No applications found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common applicant tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/applicant/apply" className="block">
                <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Plus className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Apply for Loan</p>
                      <p className="text-sm text-muted-foreground">Start a new application</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/applicant/applications" className="block">
                <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">My Applications</p>
                      <p className="text-sm text-muted-foreground">View all applications</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/applicant/loans" className="block">
                <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">My Loans</p>
                      <p className="text-sm text-muted-foreground">Manage active loans</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground">View notifications</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Need a loan?</h3>
                <p className="text-sm text-muted-foreground">
                  Apply for a loan with AOPE Credit and get quick approval.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/applicant/apply">
                  <Plus className="mr-2 h-4 w-4" />
                  Apply Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}