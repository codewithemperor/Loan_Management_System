"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Search, Filter, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Loan {
  id: string
  approvedAmount: number
  disbursementAmount: number
  monthlyPayment: number
  disbursementDate?: string
  isFullyPaid: boolean
  createdAt: string
  application: {
    id: string
    amount: number
    purpose: string
    applicant: {
      name: string
      email: string
    }
  }
}

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/loans")
      if (!response.ok) {
        throw new Error("Failed to fetch loans")
      }

      const data = await response.json()
      setLoans(data.loans || [])
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

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.application.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          loan.application.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          loan.application.applicant.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && !loan.isFullyPaid) ||
                         (statusFilter === "paid" && loan.isFullyPaid)
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (loan: Loan) => {
    if (loan.isFullyPaid) return "bg-green-100 text-green-800"
    if (loan.disbursementDate) return "bg-blue-100 text-blue-800"
    return "bg-yellow-100 text-yellow-800"
  }

  const getStatusLabel = (loan: Loan) => {
    if (loan.isFullyPaid) return "Paid"
    if (loan.disbursementDate) return "Active"
    return "Approved"
  }

  if (loading) {
    return (
      <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
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
    <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Loans</h1>
          <p className="text-muted-foreground">
            Manage and monitor all loan disbursements and repayments.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loans.length}</div>
              <p className="text-xs text-muted-foreground">
                Total loans disbursed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loans.filter(loan => !loan.isFullyPaid).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active loans
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Loans</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loans.filter(loan => loan.isFullyPaid).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Fully repaid loans
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Disbursed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
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
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Loans</CardTitle>
            <CardDescription>
              Search and filter loans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by applicant, purpose, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Loans Overview</CardTitle>
            <CardDescription>
              View all loans and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLoans.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No loans found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters or search terms."
                    : "No loans have been disbursed yet."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan ID</TableHead>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Monthly Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Disbursement Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-mono text-sm">
                            {loan.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{loan.application.applicant.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {loan.application.applicant.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{loan.disbursementAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{loan.monthlyPayment.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(loan)}>
                              {getStatusLabel(loan)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {loan.disbursementDate ? 
                              format(new Date(loan.disbursementDate), "MMM dd, yyyy") : 
                              "Not disbursed"
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/loans/${loan.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/applications/${loan.application.id}`}>
                                  <FileText className="h-4 w-4 mr-1" />
                                  Application
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}