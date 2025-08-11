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
import { FileText, Eye, Edit, Search, Filter, Calendar, Clock, CheckCircle, XCircle, AlertCircle, User } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface LoanApplication {
  id: string
  amount: number
  purpose: string
  duration: number
  status: string
  submittedAt: string
  reviewedAt?: string
  applicant: {
    id: string
    name: string
    email: string
    phoneNumber?: string
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
}

interface ApplicationsResponse {
  applications: LoanApplication[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const statusColors = {
  PENDING: "blue",
  UNDER_REVIEW: "yellow",
  ADDITIONAL_INFO_REQUESTED: "orange",
  APPROVED: "green",
  REJECTED: "red",
  DISBURSED: "purple",
  CLOSED: "gray",
}

const statusLabels = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  ADDITIONAL_INFO_REQUESTED: "Additional Info Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DISBURSED: "Disbursed",
  CLOSED: "Closed",
}

export default function OfficerApplications() {
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      })

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/applications?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch applications")
      }

      const data: ApplicationsResponse = await response.json()
      setApplications(data.applications)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error("Error fetching applications:", error)
      setError("Failed to load applications. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [currentPage, statusFilter])

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.amount.toString().includes(searchTerm)
    return matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />
      case "UNDER_REVIEW":
        return <AlertCircle className="w-4 h-4" />
      case "APPROVED":
      case "DISBURSED":
        return <CheckCircle className="w-4 h-4" />
      case "REJECTED":
        return <XCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getPriorityColor = (application: LoanApplication) => {
    const daysSinceSubmission = Math.floor((new Date().getTime() - new Date(application.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceSubmission > 7) return "red"
    if (daysSinceSubmission > 3) return "yellow"
    return "green"
  }

  const getPriorityLabel = (application: LoanApplication) => {
    const daysSinceSubmission = Math.floor((new Date().getTime() - new Date(application.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceSubmission > 7) return "High"
    if (daysSinceSubmission > 3) return "Medium"
    return "Low"
  }

  if (loading) {
    return (
      <DashboardLayout requiredRoles={[UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout requiredRoles={[UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN]}>
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
    <DashboardLayout requiredRoles={[UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Applications</h1>
          <p className="text-muted-foreground">
            Review and manage loan applications.
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
              <div className="text-2xl font-bold">
                {applications.filter(app => app.status === "PENDING").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(app => app.status === "UNDER_REVIEW").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently being reviewed
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
                {applications.filter(app => app.status === "APPROVED").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Approved this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(app => {
                  const daysSinceSubmission = Math.floor((new Date().getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
                  return daysSinceSubmission > 7
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Over 7 days pending
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
                    placeholder="Search by applicant, purpose, or amount..."
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
            <CardTitle>Applications Queue</CardTitle>
            <CardDescription>
              Review and process loan applications
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
                    : "There are no applications matching your criteria."
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
                        <TableHead>Priority</TableHead>
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
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{application.applicant.name}</div>
                                <div className="text-sm text-muted-foreground">{application.applicant.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{application.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {application.purpose}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                application.status === "APPROVED" || application.status === "DISBURSED" 
                                  ? "default" 
                                  : application.status === "REJECTED" 
                                  ? "destructive" 
                                  : "secondary"
                              }
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(application.status)}
                              {statusLabels[application.status as keyof typeof statusLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                getPriorityColor(application) === "red" ? "destructive" :
                                getPriorityColor(application) === "yellow" ? "secondary" : "outline"
                              }
                            >
                              {getPriorityLabel(application)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(application.submittedAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/officer/applications/${application.id}`}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                              {application.status === "PENDING" || application.status === "UNDER_REVIEW" ? (
                                <Button asChild size="sm">
                                  <Link href={`/officer/applications/${application.id}/review`}>
                                    <Edit className="w-4 h-4 mr-1" />
                                    Review
                                  </Link>
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}