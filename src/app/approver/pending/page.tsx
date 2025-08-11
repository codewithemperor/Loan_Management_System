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
import { 
  FileText, 
  Eye, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  ThumbsUp,
  ThumbsDown,
  TrendingUp
} from "lucide-react"
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
  reviews: Array<{
    id: string
    status: string
    comments?: string
    recommendation?: string
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

export default function PendingApprovals() {
  const [applications, setApplications] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [riskFilter, setRiskFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        status: "UNDER_REVIEW", // Only show applications that are under review (ready for approver)
      })

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
  }, [currentPage])

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.amount.toString().includes(searchTerm)
    
    const matchesRisk = riskFilter === "all" || getRiskLevel(app) === riskFilter
    
    return matchesSearch && matchesRisk
  })

  const getRiskLevel = (application: LoanApplication) => {
    // Simple risk assessment based on loan amount and duration
    const riskScore = (application.amount / 1000000) * (application.duration / 12)
    
    if (riskScore > 2) return "High"
    if (riskScore > 1) return "Medium"
    return "Low"
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "red"
      case "Medium":
        return "yellow"
      case "Low":
        return "green"
      default:
        return "gray"
    }
  }

  const getOfficerRecommendation = (application: LoanApplication) => {
    const officerReview = application.reviews.find(review => review.reviewType === "OFFICER_REVIEW")
    return officerReview?.recommendation || "No recommendation"
  }

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.toLowerCase().includes("approve")) return "green"
    if (recommendation.toLowerCase().includes("reject")) return "red"
    return "yellow"
  }

  if (loading) {
    return (
      <DashboardLayout requiredRoles={[UserRole.APPROVER, UserRole.SUPER_ADMIN]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout requiredRoles={[UserRole.APPROVER, UserRole.SUPER_ADMIN]}>
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
    <DashboardLayout requiredRoles={[UserRole.APPROVER, UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve loan applications that have been processed by loan officers.
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
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your decision
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {applications.filter(app => getRiskLevel(app) === "High").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Require careful review
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Amount</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{applications.length > 0 
                  ? Math.round(applications.reduce((sum, app) => sum + app.amount, 0) / applications.length).toLocaleString()
                  : "0"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Average loan amount
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{applications.reduce((sum, app) => sum + app.amount, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total amount pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Applications</CardTitle>
            <CardDescription>
              Search and filter applications requiring approval
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
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="Low">Low Risk</SelectItem>
                    <SelectItem value="Medium">Medium Risk</SelectItem>
                    <SelectItem value="High">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications for Approval</CardTitle>
            <CardDescription>
              Review and make final decisions on loan applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No applications found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || riskFilter !== "all" 
                    ? "Try adjusting your filters or search terms."
                    : "There are no applications awaiting approval at this time."
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
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Officer Recommendation</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((application) => {
                        const riskLevel = getRiskLevel(application)
                        const recommendation = getOfficerRecommendation(application)
                        
                        return (
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
                                  riskLevel === "High" ? "destructive" :
                                  riskLevel === "Medium" ? "secondary" : "outline"
                                }
                              >
                                {riskLevel}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  getRecommendationColor(recommendation) === "green" ? "default" :
                                  getRecommendationColor(recommendation) === "red" ? "destructive" : "secondary"
                                }
                                className="text-xs"
                              >
                                {recommendation}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(application.submittedAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`/approver/applications/${application.id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                                <Button asChild size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                                  <Link href={`/approver/applications/${application.id}/review`}>
                                    <ThumbsUp className="w-4 h-4 mr-1" />
                                    Approve
                                  </Link>
                                </Button>
                                <Button asChild size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                                  <Link href={`/approver/applications/${application.id}/review`}>
                                    <ThumbsDown className="w-4 h-4 mr-1" />
                                    Reject
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
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