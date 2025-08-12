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
import { FileText, Search, Filter, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Eye, DollarSign } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface LoanApplication {
  id: string
  amount: number
  purpose: string
  duration: number
  status: string
  submittedAt: string
  monthlyIncome: number
  employmentStatus: string
  applicant: {
    id: string
    name: string
    email: string
    phoneNumber: string
  }
  documents: Array<{
    id: string
    type: string
    fileName: string
    uploadedAt: string
  }>
  reviews: Array<{
    id: string
    status: string
    comments?: string
    reviewedAt: string
    reviewer: {
      name: string
      role: string
    }
  }>
  loan?: {
    id: string
    approvedAmount: number
    disbursementAmount: number
    monthlyPayment: number
    disbursementDate?: string
  }
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/applications?limit=1000")
      if (!response.ok) {
        throw new Error("Failed to fetch applications")
      }

      const data = await response.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error("Error fetching applications:", error)
      setError("Failed to load applications. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.applicant.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "DISBURSED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800"
      case "PENDING":
        return "bg-blue-100 text-blue-800"
      case "ADDITIONAL_INFO_REQUESTED":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
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
            <Button onClick={fetchApplications}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Applications</h1>
          <p className="text-muted-foreground">
            Manage and monitor all loan applications in the system.
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
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground">
                All time applications
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(app => ["PENDING", "UNDER_REVIEW"].includes(app.status)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(app => ["APPROVED", "DISBURSED"].includes(app.status)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully approved
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{applications.reduce((sum, app) => sum + app.amount, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total applied for
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Applications</CardTitle>
            <CardDescription>
              Search and filter loan applications
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="ADDITIONAL_INFO_REQUESTED">Additional Info</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="DISBURSED">Disbursed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Overview</CardTitle>
            <CardDescription>
              View all loan applications and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No applications found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters or search terms."
                    : "No loan applications have been submitted yet."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application ID</TableHead>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell className="font-mono text-sm">
                            {application.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{application.applicant.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {application.applicant.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{application.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {application.purpose}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(application.status)}>
                              {getStatusLabel(application.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(application.submittedAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/applications/${application.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                              {application.loan && (
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/admin/loans/${application.loan.id}`}>
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Loan
                                  </Link>
                                </Button>
                              )}
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