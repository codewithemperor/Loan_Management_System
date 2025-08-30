import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Eye, CheckCircle, XCircle, Clock, FileText, User, DollarSign, Calendar } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import DisburseButton from "@/components/DisburseButton"

async function getApplicationDetails(applicationId: string) {
  try {
    const application = await db.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
            uploadedAt: true
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: {
            reviewedAt: "desc"
          }
        },
        loan: {
          select: {
            id: true,
            approvedAmount: true,
            disbursementAmount: true,
            monthlyPayment: true,
            disbursementDate: true,
            isFullyPaid: true
          }
        }
      }
    })

    if (!application) {
      return null
    }

    return {
      ...application,
      status: application.status === "PENDING" ? "Pending" :
             application.status === "UNDER_REVIEW" ? "Under Review" :
             application.status === "ADDITIONAL_INFO_REQUESTED" ? "Additional Info Requested" :
             application.status === "APPROVED" ? "Approved" :
             application.status === "REJECTED" ? "Rejected" :
             application.status === "DISBURSED" ? "Disbursed" :
             application.status === "CLOSED" ? "Closed" : "Unknown",
      statusColor: application.status === "APPROVED" || application.status === "DISBURSED" ? "green" :
                   application.status === "PENDING" || application.status === "UNDER_REVIEW" ? "yellow" :
                   application.status === "REJECTED" ? "red" : "blue"
    }
  } catch (error) {
    console.error("Error fetching application details:", error)
    return null
  }
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return <div>Unauthorized</div>
  }

  const { id } = await params
  const application = await getApplicationDetails(id)
  
  if (!application) {
    notFound()
  }

  return (
    <DashboardLayout requiredRoles={[UserRole.APPROVER, UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/approver/pending">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Application Details</h1>
              <p className="text-muted-foreground">
                Review loan application {id}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/approver/applications/${id}/review`}>
                Review Application
              </Link>
            </Button>
            {application.status === "Approved" && (
              <DisburseButton applicationId={id} />
            )}
          </div>
        </div>

        {/* Application Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Application Status</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge className={
                application.statusColor === "green" ? "bg-green-100 text-green-800" :
                application.statusColor === "yellow" ? "bg-yellow-100 text-yellow-800" :
                application.statusColor === "red" ? "bg-red-100 text-red-800" :
                "bg-blue-100 text-blue-800"
              }>
                {application.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Submitted {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loan Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{application.amount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Duration: {application.duration} months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applicant</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{application.applicant.firstName} {application.applicant.lastName}</div>
              <p className="text-xs text-muted-foreground">
                {application.applicant.email}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{application.reviews.length}</div>
              <p className="text-xs text-muted-foreground">
                {application.reviews.length > 0 ? "Reviews completed" : "No reviews yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                  <p className="text-sm">{application.purpose || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
                  <p className="text-sm">₦{application.monthlyIncome.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employment Status</p>
                  <p className="text-sm">{application.employmentStatus}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Work Experience</p>
                  <p className="text-sm">{application.workExperience || 0} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employer</p>
                  <p className="text-sm">{application.employerName || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                  <p className="text-sm">{application.interestRate}%</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
                <p className="text-sm">Phone: {application.applicant.phoneNumber || "Not provided"}</p>
                <p className="text-sm">Email: {application.applicant.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Review all submitted documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {application.documents.length > 0 ? (
                <div className="space-y-3">
                  {application.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{document.fileName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{document.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(document.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No documents uploaded</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        {application.reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Review History</CardTitle>
              <CardDescription>
                Previous reviews and decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.reviews.map((review) => (
                  <div key={review.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{review.reviewer.firstName} {review.reviewer.lastName}</span>
                        <Badge variant="outline">{review.reviewer.role}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          review.status === "APPROVED" ? "bg-green-100 text-green-800" :
                          review.status === "REJECTED" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }>
                          {review.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.reviewedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {review.comments && (
                      <p className="text-sm text-muted-foreground">{review.comments}</p>
                    )}
                    {review.recommendation && (
                      <p className="text-sm font-medium mt-2">Recommendation: {review.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loan Information */}
        {application.loan && (
          <Card>
            <CardHeader>
              <CardTitle>Loan Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved Amount</p>
                  <p className="text-lg font-semibold">₦{application.loan.approvedAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disbursement Amount</p>
                  <p className="text-lg font-semibold">₦{application.loan.disbursementAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                  <p className="text-lg font-semibold">₦{application.loan.monthlyPayment.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={application.loan.isFullyPaid ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                    {application.loan.isFullyPaid ? "Paid" : "Active"}
                  </Badge>
                </div>
              </div>
              {application.loan.disbursementDate && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">Disbursement Date</p>
                  <p className="text-sm">{new Date(application.loan.disbursementDate).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}