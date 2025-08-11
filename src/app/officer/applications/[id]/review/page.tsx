"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Eye,
  ArrowLeft,
  Save
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface LoanApplication {
  id: string
  amount: number
  purpose: string
  duration: number
  interestRate: number
  monthlyIncome: number
  employmentStatus: string
  employerName?: string
  workExperience?: number
  phoneNumber: string
  address: string
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
    filePath: string
    fileSize: number
    uploadedAt: string
  }>
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

export default function ReviewApplication() {
  const params = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<LoanApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [reviewData, setReviewData] = useState({
    status: "",
    comments: "",
    recommendation: "",
  })

  const fetchApplication = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/applications/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch application")
      }
      const data = await response.json()
      setApplication(data.application)
    } catch (error) {
      console.error("Error fetching application:", error)
      setError("Failed to load application. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchApplication()
    }
  }, [params.id])

  const handleSubmitReview = async () => {
    if (!reviewData.status) {
      alert("Please select a decision")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/applications/${params.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit review")
      }

      alert("Review submitted successfully!")
      router.push("/officer/applications")
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "blue"
      case "UNDER_REVIEW":
        return "yellow"
      case "ADDITIONAL_INFO_REQUESTED":
        return "orange"
      case "APPROVED":
        return "green"
      case "REJECTED":
        return "red"
      case "DISBURSED":
        return "purple"
      case "CLOSED":
        return "gray"
      default:
        return "gray"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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

  if (error || !application) {
    return (
      <DashboardLayout requiredRoles={[UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || "Application not found"}</p>
            <Button asChild>
              <Link href="/officer/applications">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Applications
              </Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRoles={[UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/officer/applications">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">Review Application</h1>
            </div>
            <p className="text-muted-foreground">
              Application ID: {application.id}
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {getStatusColor(application.status) === "green" ? <CheckCircle className="w-4 h-4" /> :
             getStatusColor(application.status) === "red" ? <XCircle className="w-4 h-4" /> :
             getStatusColor(application.status) === "yellow" ? <Clock className="w-4 h-4" /> :
             <AlertCircle className="w-4 h-4" />}
            {application.status.replace("_", " ")}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{application.applicant.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="font-medium">{application.applicant.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    <p className="font-medium">{application.phoneNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                    <p className="font-medium">{application.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Loan Amount</Label>
                    <p className="font-medium text-lg">₦{application.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                    <p className="font-medium">{application.duration} months</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Interest Rate</Label>
                    <p className="font-medium">{application.interestRate}%</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Monthly Income</Label>
                    <p className="font-medium">₦{application.monthlyIncome.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Purpose</Label>
                  <p className="font-medium">{application.purpose}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employment Status</Label>
                    <p className="font-medium">{application.employmentStatus.replace("_", " ")}</p>
                  </div>
                  {application.employerName && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Employer</Label>
                      <p className="font-medium">{application.employerName}</p>
                    </div>
                  )}
                  {application.workExperience && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Work Experience</Label>
                      <p className="font-medium">{application.workExperience} years</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Submitted Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.documents.length === 0 ? (
                  <p className="text-muted-foreground">No documents uploaded</p>
                ) : (
                  <div className="space-y-3">
                    {application.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.type.replace("_", " ")}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.fileName} • {formatFileSize(doc.fileSize)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.filePath} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.filePath} download>
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Previous Reviews */}
            {application.reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Previous Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {application.reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              review.status === "APPROVED" ? "default" :
                              review.status === "REJECTED" ? "destructive" : "secondary"
                            }>
                              {review.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              by {review.reviewer.name} ({review.reviewer.role})
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(review.reviewedAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {review.comments && (
                          <p className="text-sm mt-2">{review.comments}</p>
                        )}
                        {review.recommendation && (
                          <p className="text-sm font-medium mt-2">
                            Recommendation: {review.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Review Form */}
          <div className="space-y-6">
            {/* Review Form */}
            <Card>
              <CardHeader>
                <CardTitle>Submit Review</CardTitle>
                <CardDescription>
                  Make a decision on this loan application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="decision">Decision</Label>
                  <Select onValueChange={(value) => setReviewData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVED">Approve</SelectItem>
                      <SelectItem value="REJECTED">Reject</SelectItem>
                      <SelectItem value="REQUEST_INFO">Request Additional Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Provide detailed comments about your decision..."
                    value={reviewData.comments}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="recommendation">Recommendation (Optional)</Label>
                  <Input
                    id="recommendation"
                    placeholder="e.g., Recommend for approval with conditions"
                    value={reviewData.recommendation}
                    onChange={(e) => setReviewData(prev => ({ ...prev, recommendation: e.target.value }))}
                  />
                </div>

                <Button 
                  onClick={handleSubmitReview} 
                  disabled={submitting || !reviewData.status}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Application Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Application Submitted</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(application.submittedAt), "MMM dd, yyyy 'at' HH:mm")}
                      </p>
                    </div>
                  </div>
                  
                  {application.reviewedAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Under Review</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(application.reviewedAt), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {application.reviews.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Review Completed</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(application.reviews[0].reviewedAt), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}