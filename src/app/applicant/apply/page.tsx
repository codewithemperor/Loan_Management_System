"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Upload, X, AlertCircle, CheckCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DocumentUpload } from "@/components/documents/document-upload"

const loanApplicationSchema = z.object({
  amount: z.number().min(50000, "Minimum loan amount is ₦50,000").max(5000000, "Maximum loan amount is ₦5,000,000"),
  purpose: z.string().min(10, "Please provide a detailed purpose"),
  duration: z.number().min(1, "Minimum duration is 1 month").max(60, "Maximum duration is 60 months"),
  monthlyIncome: z.number().min(20000, "Minimum monthly income is ₦20,000"),
  employmentStatus: z.enum(["EMPLOYED", "SELF_EMPLOYED", "UNEMPLOYED", "RETIRED", "STUDENT"]),
  employerName: z.string().optional(),
  workExperience: z.number().min(0).max(50).optional(),
  phoneNumber: z.string().min(10, "Please provide a valid phone number"),
  address: z.string().min(10, "Please provide your full address"),
})

type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>

export default function ApplyForLoan() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loanApplicationId, setLoanApplicationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      amount: 100000,
      duration: 12,
      monthlyIncome: 50000,
      employmentStatus: "EMPLOYED",
      workExperience: 2,
    }
  })

  const watchedValues = watch()

  const onSubmit = async (data: LoanApplicationFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Create loan application first
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create loan application")
      }

      const result = await response.json()
      setLoanApplicationId(result.id)
      setSuccess("Loan application created successfully! Please upload the required documents.")
      setCurrentStep(4) // Move to documents step
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application")
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: 1, name: "Personal Information", description: "Your basic details" },
    { id: 2, name: "Loan Details", description: "Loan amount and purpose" },
    { id: 3, name: "Employment Information", description: "Your employment details" },
    { id: 4, name: "Documents", description: "Upload required documents" },
  ]

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return watchedValues.phoneNumber && watchedValues.address
      case 2:
        return watchedValues.amount && watchedValues.purpose && watchedValues.duration
      case 3:
        return watchedValues.monthlyIncome && watchedValues.employmentStatus
      case 4:
        return loanApplicationId !== null
      default:
        return false
    }
  }

  return (
    <DashboardLayout requiredRoles={[UserRole.APPLICANT, UserRole.SUPER_ADMIN]}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply for Loan</h1>
          <p className="text-muted-foreground">
            Complete your loan application in just a few steps.
          </p>
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

        {/* Progress Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Application Progress</CardTitle>
            <CardDescription>
              Step {currentStep} of {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={(currentStep / steps.length) * 100} className="w-full" />
              <div className="grid grid-cols-4 gap-4">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`text-center p-4 rounded-lg border ${
                      step.id === currentStep
                        ? "border-primary bg-primary/5"
                        : step.id < currentStep
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      step.id === currentStep
                        ? "bg-primary text-white"
                        : step.id < currentStep
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {step.id < currentStep ? <CheckCircle className="w-4 h-4" /> : step.id}
                    </div>
                    <h3 className="font-medium text-sm">{step.name}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Please provide your personal contact details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+2348012345678"
                      {...register("phoneNumber")}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Your full address"
                      {...register("address")}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Loan Details */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
                <CardDescription>
                  Tell us about the loan you need.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Loan Amount (₦)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="100000"
                      {...register("amount", { valueAsNumber: true })}
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (months)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="12"
                      {...register("duration", { valueAsNumber: true })}
                    />
                    {errors.duration && (
                      <p className="text-sm text-red-500 mt-1">{errors.duration.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose of Loan</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Please describe the purpose of your loan in detail..."
                    {...register("purpose")}
                  />
                  {errors.purpose && (
                    <p className="text-sm text-red-500 mt-1">{errors.purpose.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Employment Information */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
                <CardDescription>
                  Help us understand your employment status and income.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employmentStatus">Employment Status</Label>
                    <Select onValueChange={(value) => setValue("employmentStatus", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPLOYED">Employed</SelectItem>
                        <SelectItem value="SELF_EMPLOYED">Self Employed</SelectItem>
                        <SelectItem value="UNEMPLOYED">Unemployed</SelectItem>
                        <SelectItem value="RETIRED">Retired</SelectItem>
                        <SelectItem value="STUDENT">Student</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.employmentStatus && (
                      <p className="text-sm text-red-500 mt-1">{errors.employmentStatus.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="monthlyIncome">Monthly Income (₦)</Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      placeholder="50000"
                      {...register("monthlyIncome", { valueAsNumber: true })}
                    />
                    {errors.monthlyIncome && (
                      <p className="text-sm text-red-500 mt-1">{errors.monthlyIncome.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employerName">Employer Name</Label>
                    <Input
                      id="employerName"
                      placeholder="Your employer's name"
                      {...register("employerName")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workExperience">Work Experience (years)</Label>
                    <Input
                      id="workExperience"
                      type="number"
                      placeholder="2"
                      {...register("workExperience", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && loanApplicationId && (
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>
                  Please upload all required documents for your loan application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUpload 
                  loanApplicationId={loanApplicationId}
                  onDocumentUploaded={() => {
                    // Refresh documents list
                  }}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && !loanApplicationId && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Complete Previous Steps</h3>
                  <p className="text-muted-foreground">
                    Please complete the loan application details first before uploading documents.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <div className="space-x-2">
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceedToNextStep()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    // Redirect to applications page
                    window.location.href = "/applicant/applications"
                  }}
                >
                  View Applications
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}