"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CreditCard, Clock, CheckCircle, AlertCircle, Plus, Eye } from "lucide-react"
import Link from "next/link"

export default function ApplicantDashboard() {
  return (
    <DashboardLayout requiredRoles={[UserRole.APPLICANT, UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applicant Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your loan applications and track their status.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Currently being processed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                Currently active loans
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦200,000</div>
              <p className="text-xs text-muted-foreground">
                Total amount borrowed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* My Applications */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Applications</CardTitle>
                  <CardDescription>
                    Track your loan application status
                  </CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href="/applicant/applications">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    amount: "₦500,000", 
                    purpose: "Business expansion", 
                    status: "Under Review",
                    submitted: "2 days ago",
                    statusColor: "yellow"
                  },
                  { 
                    amount: "₦200,000", 
                    purpose: "Emergency medical", 
                    status: "Approved",
                    submitted: "1 week ago",
                    statusColor: "green"
                  },
                ].map((application, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium leading-none">{application.amount}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          application.statusColor === "green" ? "bg-green-100 text-green-800" :
                          application.statusColor === "yellow" ? "bg-yellow-100 text-yellow-800" :
                          application.statusColor === "red" ? "bg-red-100 text-red-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {application.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{application.purpose}</p>
                      <p className="text-xs text-muted-foreground">Submitted {application.submitted}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
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
                Common applicant tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/applicant/apply" className="block">
                <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Plus className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Apply for Loan</p>
                      <p className="text-sm text-muted-foreground">Start a new application</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/applicant/applications" className="block">
                <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">My Applications</p>
                      <p className="text-sm text-muted-foreground">View all applications</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/applicant/loans" className="block">
                <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">My Loans</p>
                      <p className="text-sm text-muted-foreground">Manage active loans</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <div className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border cursor-pointer">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground">3 new notifications</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Need a loan?</h3>
                <p className="text-sm text-muted-foreground">
                  Apply for a loan with AOPE Credit and get quick approval.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/applicant/apply">
                  <Plus className="mr-2 h-4 w-4" />
                  Apply Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}