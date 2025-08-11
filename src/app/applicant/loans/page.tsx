"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Eye } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Loan {
  id: string
  approvedAmount: number
  disbursementAmount: number
  interestRate: number
  duration: number
  monthlyPayment: number
  disbursementDate?: string
  totalRepaid: number
  nextPaymentDue?: string
  isFullyPaid: boolean
  closedAt?: string
  application: {
    id: string
    purpose: string
    submittedAt: string
  }
}

export default function MyLoans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/loans")
      if (!response.ok) {
        throw new Error("Failed to fetch loans")
      }
      const data = await response.json()
      setLoans(data.loans)
    } catch (error) {
      console.error("Error fetching loans:", error)
      setError("Failed to load loans. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const activeLoans = loans.filter(loan => !loan.isFullyPaid)
  const completedLoans = loans.filter(loan => loan.isFullyPaid)

  const getPaymentStatus = (loan: Loan) => {
    if (loan.isFullyPaid) return "completed"
    if (!loan.nextPaymentDue) return "pending"
    
    const dueDate = new Date(loan.nextPaymentDue)
    const today = new Date()
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) return "overdue"
    if (daysUntilDue <= 7) return "due-soon"
    return "on-track"
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green"
      case "overdue":
        return "red"
      case "due-soon":
        return "yellow"
      case "on-track":
        return "blue"
      default:
        return "gray"
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "overdue":
        return <AlertCircle className="w-4 h-4" />
      case "due-soon":
        return <Clock className="w-4 h-4" />
      case "on-track":
        return <TrendingUp className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const calculateProgress = (loan: Loan) => {
    if (loan.isFullyPaid) return 100
    if (!loan.disbursementAmount) return 0
    return Math.min((loan.totalRepaid / loan.disbursementAmount) * 100, 100)
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
            <Button onClick={fetchLoans}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRoles={[UserRole.APPLICANT, UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Loans</h1>
          <p className="text-muted-foreground">
            Manage your active loans and view repayment history.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLoans.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently active loans
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{loans.reduce((sum, loan) => sum + loan.disbursementAmount, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total amount disbursed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Repaid</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{loans.reduce((sum, loan) => sum + loan.totalRepaid, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total amount repaid
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeLoans.length > 0 && activeLoans[0].nextPaymentDue 
                  ? format(new Date(activeLoans[0].nextPaymentDue), "MMM dd")
                  : "N/A"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Next payment due date
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Loans */}
        {activeLoans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Loans</CardTitle>
              <CardDescription>
                Your currently active loans and repayment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeLoans.map((loan) => {
                  const paymentStatus = getPaymentStatus(loan)
                  const progress = calculateProgress(loan)
                  
                  return (
                    <div key={loan.id} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            ₦{loan.disbursementAmount.toLocaleString()}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {loan.application.purpose}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              paymentStatus === "completed" ? "default" :
                              paymentStatus === "overdue" ? "destructive" :
                              paymentStatus === "due-soon" ? "secondary" : "outline"
                            }
                            className="flex items-center gap-1"
                          >
                            {getPaymentStatusIcon(paymentStatus)}
                            {paymentStatus.replace("-", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Payment</p>
                          <p className="font-medium">₦{loan.monthlyPayment.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Interest Rate</p>
                          <p className="font-medium">{loan.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Next Payment Due</p>
                          <p className="font-medium">
                            {loan.nextPaymentDue 
                              ? format(new Date(loan.nextPaymentDue), "MMM dd, yyyy")
                              : "N/A"
                            }
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Repayment Progress</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>₦{loan.totalRepaid.toLocaleString()} paid</span>
                          <span>₦{(loan.disbursementAmount - loan.totalRepaid).toLocaleString()} remaining</span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button asChild variant="outline">
                          <Link href={`/applicant/loans/${loan.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Loans */}
        {completedLoans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Completed Loans</CardTitle>
              <CardDescription>
                Your fully repaid loans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Disbursement Date</TableHead>
                      <TableHead>Closed Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-mono text-sm">
                          {loan.id.slice(-8)}
                        </TableCell>
                        <TableCell className="font-medium">
                          ₦{loan.disbursementAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>{loan.application.purpose}</TableCell>
                        <TableCell>
                          {loan.disbursementDate 
                            ? format(new Date(loan.disbursementDate), "MMM dd, yyyy")
                            : "N/A"
                          }
                        </TableCell>
                        <TableCell>
                          {loan.closedAt 
                            ? format(new Date(loan.closedAt), "MMM dd, yyyy")
                            : "N/A"
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/applicant/loans/${loan.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Loans */}
        {loans.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No loans found</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any active or completed loans yet.
                </p>
                <Button asChild>
                  <Link href="/applicant/apply">Apply for Loan</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}