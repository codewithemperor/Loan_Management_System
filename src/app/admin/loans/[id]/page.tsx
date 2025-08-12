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

async function getLoanDetails(loanId: string) {
  try {
    const loan = await db.loan.findUnique({
      where: { id: loanId },
      include: {
        application: {
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
                status: true,
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
            }
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    if (!loan) {
      return null
    }

    return {
      ...loan,
      application: {
        ...loan.application,
        status: loan.application.status === "PENDING" ? "Pending" :
               loan.application.status === "UNDER_REVIEW" ? "Under Review" :
               loan.application.status === "ADDITIONAL_INFO_REQUESTED" ? "Additional Info Requested" :
               loan.application.status === "APPROVED" ? "Approved" :
               loan.application.status === "REJECTED" ? "Rejected" :
               loan.application.status === "DISBURSED" ? "Disbursed" :
               loan.application.status === "CLOSED" ? "Closed" : "Unknown",
        statusColor: loan.application.status === "APPROVED" || loan.application.status === "DISBURSED" ? "green" :
                     loan.application.status === "PENDING" || loan.application.status === "UNDER_REVIEW" ? "yellow" :
                     loan.application.status === "REJECTED" ? "red" : "blue"
      }
    }
  } catch (error) {
    console.error("Error fetching loan details:", error)
    return null
  }
}

export default async function LoanDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return <div>Unauthorized</div>
  }

  const loan = await getLoanDetails(params.id)
  
  if (!loan) {
    notFound()
  }

  return (
    <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/loans">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Loans
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Loan Details</h1>
              <p className="text-muted-foreground">
                View loan information for {params.id}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/applications/${loan.applicationId}`}>
                View Application
              </Link>
            </Button>
          </div>
        </div>

        {/* Loan Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loan Status</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge className={loan.isFullyPaid ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                {loan.isFullyPaid ? "Paid" : "Active"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Created {new Date(loan.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{loan.approvedAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Duration: {loan.duration} months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disbursed Amount</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{loan.disbursementAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {loan.disbursementDate ? new Date(loan.disbursementDate).toLocaleDateString() : "Not disbursed"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Payment</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{loan.monthlyPayment.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total Repaid: ₦{loan.totalRepaid.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Loan Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Loan Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                  <p className="text-sm">{loan.interestRate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-sm">{loan.duration} months</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Repaid</p>
                  <p className="text-sm">₦{loan.totalRepaid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next Payment Due</p>
                  <p className="text-sm">{loan.nextPaymentDue ? new Date(loan.nextPaymentDue).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bank Information</p>
                <p className="text-sm">Bank: {loan.bankName || "Not specified"}</p>
                <p className="text-sm">Account: {loan.bankAccount || "Not specified"}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p className="text-sm">{loan.creator.firstName} {loan.creator.lastName} ({loan.creator.role})</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Application Status</p>
                  <Badge className={
                    loan.application.statusColor === "green" ? "bg-green-100 text-green-800" :
                    loan.application.statusColor === "yellow" ? "bg-yellow-100 text-yellow-800" :
                    loan.application.statusColor === "red" ? "bg-red-100 text-red-800" :
                    "bg-blue-100 text-blue-800"
                  }>
                    {loan.application.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested Amount</p>
                  <p className="text-sm">₦{loan.application.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                  <p className="text-sm">{loan.application.purpose || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
                  <p className="text-sm">₦{loan.application.monthlyIncome.toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applicant</p>
                <p className="text-sm">{loan.application.applicant.firstName} {loan.application.applicant.lastName}</p>
                <p className="text-sm">{loan.application.applicant.email}</p>
                <p className="text-sm">{loan.application.applicant.phoneNumber || "No phone provided"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Application Documents</CardTitle>
            <CardDescription>
              Documents submitted with the loan application
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loan.application.documents.length > 0 ? (
              <div className="space-y-3">
                {loan.application.documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium">{document.fileName}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={
                            document.status === "APPROVED" ? "bg-green-100 text-green-800" :
                            document.status === "REJECTED" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }>
                            {document.status}
                          </Badge>
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

        {/* Application Reviews */}
        {loan.application.reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Application Reviews</CardTitle>
              <CardDescription>
                Reviews performed on the loan application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loan.application.reviews.map((review) => (
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

        {/* Repayment Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Repayment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Loan Amount</p>
                <p className="text-lg font-semibold">₦{loan.approvedAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Repaid</p>
                <p className="text-lg font-semibold">₦{loan.totalRepaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
                <p className="text-lg font-semibold">₦{(loan.approvedAmount - loan.totalRepaid).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                <Badge className={loan.isFullyPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {loan.isFullyPaid ? "Fully Paid" : "Ongoing"}
                </Badge>
              </div>
            </div>
            
            {loan.nextPaymentDue && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Next Payment Due</p>
                <p className="text-lg font-semibold text-yellow-900">{new Date(loan.nextPaymentDue).toLocaleDateString()}</p>
                <p className="text-sm text-yellow-700">Amount: ₦{loan.monthlyPayment.toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}