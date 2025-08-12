import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, DollarSign, Calendar, User, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"

async function getLoanDetails(loanId: string, userId: string) {
  try {
    const loan = await db.loan.findFirst({
      where: {
        id: loanId,
        application: {
          applicantId: userId
        }
      },
      include: {
        application: {
          include: {
            applicant: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!loan) {
      return null
    }

    return {
      id: loan.id,
      approvedAmount: loan.approvedAmount,
      disbursementAmount: loan.disbursementAmount,
      interestRate: loan.interestRate,
      duration: loan.duration,
      monthlyPayment: loan.monthlyPayment,
      totalRepaid: loan.totalRepaid,
      isFullyPaid: loan.isFullyPaid,
      disbursementDate: loan.disbursementDate,
      nextPaymentDue: loan.nextPaymentDue,
      closedAt: loan.closedAt,
      bankAccount: loan.bankAccount,
      bankName: loan.bankName,
      application: {
        id: loan.application.id,
        amount: loan.application.amount,
        purpose: loan.application.purpose,
        applicant: {
          name: `${loan.application.applicant.firstName} ${loan.application.applicant.lastName}`,
          email: loan.application.applicant.email
        }
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

  const loan = await getLoanDetails(params.id, session.user.id)

  if (!loan) {
    notFound()
  }

  return (
    <DashboardLayout requiredRoles={[UserRole.APPLICANT, UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/applicant/loans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Loans
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Loan Details</h1>
            <p className="text-muted-foreground">
              View detailed information about your loan
            </p>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {loan.isFullyPaid ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-blue-600" />}
              <span>Loan Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={loan.isFullyPaid ? "default" : "secondary"}>
                {loan.isFullyPaid ? "Fully Paid" : "Active"}
              </Badge>
              {loan.disbursementDate && (
                <span className="text-sm text-muted-foreground">
                  Disbursed on {new Date(loan.disbursementDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loan Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Loan Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Loan Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Approved Amount</label>
                <p className="text-sm font-medium">₦{loan.approvedAmount.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Disbursement Amount</label>
                <p className="text-sm font-medium">₦{loan.disbursementAmount.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Interest Rate</label>
                <p className="text-sm font-medium">{loan.interestRate}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Duration</label>
                <p className="text-sm font-medium">{loan.duration} months</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Monthly Payment</label>
                <p className="text-sm font-medium">₦{loan.monthlyPayment.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Repayment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Repayment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Total Repaid</label>
                <p className="text-sm font-medium">₦{loan.totalRepaid.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Remaining Balance</label>
                <p className="text-sm font-medium">
                  ₦{(loan.disbursementAmount - loan.totalRepaid).toLocaleString()}
                </p>
              </div>
              {loan.nextPaymentDue && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Next Payment Due</label>
                  <p className="text-sm font-medium">
                    {new Date(loan.nextPaymentDue).toLocaleDateString()}
                  </p>
                </div>
              )}
              {loan.closedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Closed Date</label>
                  <p className="text-sm font-medium">
                    {new Date(loan.closedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Bank Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Bank Name</label>
                <p className="text-sm font-medium">{loan.bankName || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Bank Account</label>
                <p className="text-sm font-medium">{loan.bankAccount || "Not specified"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Application Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Application Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Applicant</label>
                <p className="text-sm font-medium">{loan.application.applicant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm font-medium">{loan.application.applicant.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Original Request</label>
                <p className="text-sm font-medium">₦{loan.application.amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Purpose</label>
                <p className="text-sm font-medium">{loan.application.purpose}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Progress</CardTitle>
            <CardDescription>
              Track your loan repayment progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Loan Amount</span>
                <span className="text-sm font-medium">₦{loan.disbursementAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount Repaid</span>
                <span className="text-sm font-medium">₦{loan.totalRepaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Remaining Balance</span>
                <span className="text-sm font-medium">
                  ₦{(loan.disbursementAmount - loan.totalRepaid).toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(loan.totalRepaid / loan.disbursementAmount) * 100}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-600">
                {Math.round((loan.totalRepaid / loan.disbursementAmount) * 100)}% Paid
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button asChild>
                <Link href={`/applicant/applications/${loan.application.id}`}>
                  View Application
                </Link>
              </Button>
              {!loan.isFullyPaid && (
                <Button variant="outline">
                  Make Payment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}