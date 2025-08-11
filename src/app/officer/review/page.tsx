"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Eye, Edit, CheckCircle, XCircle, Clock, FileText, User, DollarSign, Calendar } from "lucide-react"
import { DocumentReview } from "@/components/documents/document-review"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface LoanApplication {
  id: string
  amount: number
  purpose: string
  duration: number
  status: string
  createdAt: string
  applicant: {
    name: string
    email: string
    phoneNumber: string
    address: string
  }
  documents: Array<{
    id: string
    fileName: string
    fileType: string
    fileSize: number
    documentType: string
    status: string
    uploadedAt: string
  }>
}

export default function ReviewApplication() {
  const router = useRouter()
  const [application, setApplication] = useState<LoanApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewNotes, setReviewNotes] = useState("")
  const [recommendation, setRecommendation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Get application ID from URL
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const applicationId = searchParams.get('id')

  useEffect(() => {
    if (applicationId) {
      fetchApplication()
    }
  }, [applicationId])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`)
      if (!response.ok) throw new Error("Failed to fetch application")
      
      const data = await response.json()
      setApplication(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch application")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!recommendation) {
      setError("Please select a recommendation")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/applications/${applicationId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recommendation,
          notes: reviewNotes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit review")
      }

      setSuccess("Review submitted successfully!")
      setTimeout(() => {
        router.push("/officer/applications")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "UNDER_REVIEW": return "bg-blue-100 text-blue-800"
      case "APPROVED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout requiredRoles={[UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!application) {
    return (
      <DashboardLayout requiredRoles={[UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN]}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Application Not Found</h2>
          <Link href="/officer/applications">
            <Button>Back to Applications</Button>
          </Link>
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
            <Link href="/officer/applications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Review Application</h1>
              <p className="text-muted-foreground">
                Application ID: {application.id}
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

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Application Details */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg">{application.applicant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg">{application.applicant.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                <p className="text-lg">{application.applicant.phoneNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-lg">{application.applicant.address}</p>
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
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Loan Amount</label>
                <p className="text-lg font-semibold">{formatCurrency(application.amount)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Duration</label>
                <p className="text-lg">{application.duration} months</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Purpose</label>
                <p className="text-lg">{application.purpose}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Applied Date</label>
                <p className="text-lg">{new Date(application.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Review and verify all submitted documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentReview 
              loanApplicationId={application.id}
              onDocumentReviewed={fetchApplication}
            />
          </CardContent>
        </Card>

        {/* Review Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Loan Officer Review
            </CardTitle>
            <CardDescription>
              Provide your professional assessment and recommendation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Recommendation</label>
              <Select value={recommendation} onValueChange={setRecommendation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                  <SelectItem value="REQUEST_MORE_INFO">Request More Information</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Review Notes</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Provide detailed notes about your review decision, including any concerns or additional information needed..."
                rows={6}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => router.push("/officer/applications")}>
                Cancel
              </Button>
              <Button onClick={handleSubmitReview} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}