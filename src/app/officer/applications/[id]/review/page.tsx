"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  User, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Download,
  Eye
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Document {
  id: string
  fileName: string
  type: string
  uploadedAt: string
  filePath: string
}

interface Review {
  id: string
  status: string
  comments?: string
  reviewedAt: string
  reviewer: {
    name: string
    role: string
  }
}

interface LoanApplication {
  id: string
  amount: number
  purpose: string
  duration: number
  status: string
  submittedAt: string
  monthlyIncome: number
  employmentStatus: string
  employerName?: string
  workExperience?: number
  phoneNumber: string
  address: string
  interestRate: number
  accountNumber?: string
  bankName?: string
  bvn?: string
  nin?: string
  applicant: {
    id: string
    name: string
    email: string
    phoneNumber: string
  }
  documents: Document[]
  reviews: Review[]
  loan?: {
    id: string
    approvedAmount: number
    disbursementAmount: number
    monthlyPayment: number
    totalRepayment: number
    interestRate: number
    disbursementDate?: string
    isFullyPaid: boolean
  }
}

export default function OfficerApplicationReview() {
  const router = useRouter()
  const [application, setApplication] = useState<LoanApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [decision, setDecision] = useState<string>("")
  const [comments, setComments] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const pathParts = window.location.pathname.split('/')
        const applicationId = pathParts[pathParts.length - 2]
        
        const response = await fetch(`/api/applications/${applicationId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch application")
        }
        
        const data = await response.json()
        setApplication(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch application")
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [])

  const handleSubmitReview = async () => {
    if (!decision || !application) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/applications/${application.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          decision,
          comments,
          reviewType: "OFFICER_REVIEW"
        })
      })

      if (!response.ok) {
        throw new Error("Failed to submit review")
      }

      // Redirect back to dashboard
      router.push("/officer/applications")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800"
      case "PENDING":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(filePath)
      if (!response.ok) throw new Error("Failed to download document")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download document")
    }
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
              <Link href="/officer">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
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
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/officer">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Application Review</h1>
              <p className="text-muted-foreground">
                Review loan application {application.id.slice(-8)}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(application.status)}>
            {application.status}
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-lg">{application.applicant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg">{application.applicant.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-lg">{application.applicant.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-lg">{application.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Loan Amount</p>
                    <p className="text-lg font-semibold">₦{application.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <p className="text-lg">{application.duration} months</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                    <p className="text-lg font-semibold">{application.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
                    <p className="text-lg">₦{application.monthlyIncome.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employment Status</p>
                    <p className="text-lg">{application.employmentStatus}</p>
                  </div>
                  {application.employerName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Employer</p>
                      <p className="text-lg">{application.employerName}</p>
                    </div>
                  )}
                  {application.workExperience && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Work Experience</p>
                      <p className="text-lg">{application.workExperience} years</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                    <p className="text-lg">{application.purpose}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {application.accountNumber && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                      <p className="text-lg font-mono">•••• {application.accountNumber.slice(-4)}</p>
                    </div>
                  )}
                  {application.bankName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                      <p className="text-lg">{application.bankName}</p>
                    </div>
                  )}
                  {application.bvn && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">BVN</p>
                      <p className="text-lg font-mono">•••• {application.bvn.slice(-4)}</p>
                    </div>
                  )}
                  {application.nin && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">NIN</p>
                      <p className="text-lg font-mono">•••• {application.nin.slice(-4)}</p>
                    </div>
                  )}
                  {(!application.accountNumber && !application.bankName && !application.bvn && !application.nin) && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">No account details provided</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Uploaded Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.documents.length === 0 ? (
                  <p className="text-muted-foreground">No documents uploaded</p>
                ) : (
                  <div className="space-y-3">
                    {application.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium">{doc.fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.type} • {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc.filePath, doc.fileName)}
                          >
                            <Download className="h-4 w-4" />
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
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Previous Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {application.reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(review.status)}>
                              {review.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {review.reviewer.name} ({review.reviewer.role})
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.reviewedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comments && (
                          <p className="text-sm mt-2">{review.comments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Decision Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Make Decision</CardTitle>
                <CardDescription>
                  Review and make a decision on this loan application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Decision</label>
                  <div className="flex gap-2">
                    <Button
                      variant={decision === "APPROVED" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setDecision("APPROVED")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant={decision === "REJECTED" ? "destructive" : "outline"}
                      className="flex-1"
                      onClick={() => setDecision("REJECTED")}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Request Additional Info</label>
                  <Button
                    variant={decision === "REQUEST_INFO" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setDecision("REQUEST_INFO")}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Request Additional Information
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Comments</label>
                  <Textarea
                    placeholder="Provide comments for your decision..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitReview}
                  disabled={!decision || submitting}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </CardContent>
            </Card>

            {/* Application Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Application Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{new Date(application.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documents</span>
                  <span>{application.documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviews</span>
                  <span>{application.reviews.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}