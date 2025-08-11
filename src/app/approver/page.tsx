"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, XCircle, CreditCard, Eye, ThumbsUp, ThumbsDown } from "lucide-react"
import Link from "next/link"

export default function ApproverDashboard() {
  return (
    <DashboardLayout requiredRoles={[UserRole.APPROVER, UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approver Dashboard</h1>
          <p className="text-muted-foreground">
            Review and approve loan applications for AOPE Credit.
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
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your decision
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Loans approved today
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Applications rejected
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦2.5M</div>
              <p className="text-xs text-muted-foreground">
                Total amount approved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Applications for Approval */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Applications for Approval</CardTitle>
                  <CardDescription>
                    Loan applications ready for your approval
                  </CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href="/approver/pending">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    name: "John Doe", 
                    amount: "₦500,000", 
                    purpose: "Business expansion", 
                    officer: "Loan Officer 1",
                    risk: "Low",
                    recommended: "Approve"
                  },
                  { 
                    name: "Jane Smith", 
                    amount: "₦1,000,000", 
                    purpose: "Home renovation", 
                    officer: "Loan Officer 2",
                    risk: "Medium",
                    recommended: "Approve"
                  },
                  { 
                    name: "Mike Johnson", 
                    amount: "₦200,000", 
                    purpose: "Emergency medical", 
                    officer: "Loan Officer 1",
                    risk: "Low",
                    recommended: "Approve"
                  },
                  { 
                    name: "Sarah Williams", 
                    amount: "₦750,000", 
                    purpose: "Education fees", 
                    officer: "Loan Officer 3",
                    risk: "High",
                    recommended: "Reject"
                  },
                ].map((application, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium leading-none">{application.name}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          application.risk === "High" ? "bg-red-100 text-red-800" :
                          application.risk === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {application.risk} Risk
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{application.amount} • {application.purpose}</p>
                      <p className="text-xs text-muted-foreground">Reviewed by {application.officer}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">Recommendation:</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          application.recommended === "Approve" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {application.recommended}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common approver tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/approver/pending" className="block">
                <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Pending Approvals</p>
                      <p className="text-sm text-muted-foreground">12 applications waiting</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/approver/approved" className="block">
                <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Approved Loans</p>
                      <p className="text-sm text-muted-foreground">View approved applications</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                <div className="flex items-center space-x-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Rejected Applications</p>
                    <p className="text-sm text-muted-foreground">View rejected applications</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Disbursement Queue</p>
                    <p className="text-sm text-muted-foreground">8 loans ready for disbursement</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}