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

const loanApplicationSchema = z.object({
  amount: z.number().min(50000, "Minimum loan amount is ₦50,000").max(5000000, "Maximum loan amount is ₦5,000,000"),
  purpose: z.string().min(10, "Please provide a detailed purpose"),
  duration: z.number().min(1, "Please select a loan duration"),
  monthlyIncome: z.number().min(20000, "Minimum monthly income is ₦20,000"),
  employmentStatus: z.enum(["EMPLOYED", "SELF_EMPLOYED", "UNEMPLOYED", "RETIRED", "STUDENT"]),
  employerName: z.string().optional(),
  workExperience: z.number().min(0).max(50).optional(),
  phoneNumber: z.string().min(10, "Please provide a valid phone number"),
  address: z.string().min(10, "Please provide your full address"),
  accountNumber: z.string().min(10, "Please provide a valid account number").max(20, "Account number too long"),
  bankName: z.string().min(2, "Please provide bank name"),
  bvn: z.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits").optional(),
  nin: z.string().min(11, "NIN must be 11 digits").max(11, "NIN must be 11 digits").optional(),
})

type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>

export default function ApplyForLoan() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [interestRates, setInterestRates] = useState<Array<{months: number, rate: number}>>([])
  const [loadingRates, setLoadingRates] = useState(true)
  const [selectedIdCardType, setSelectedIdCardType] = useState("NATIONAL_ID")
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [proofOfFundsFile, setProofOfFundsFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      amount: 100000,
      monthlyIncome: 50000,
      employmentStatus: "EMPLOYED",
      workExperience: 2,
    }
  })

  const watchedValues = watch()

  const onSubmit = async (data: LoanApplicationFormData) => {
    console.log("Form submission started", { currentStep, data }) // Debug log
    
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (currentStep < 6) {
        // Just move to next step for steps 1-5
        console.log("Moving to next step:", currentStep + 1)
        setCurrentStep(currentStep + 1)
      } else if (currentStep === 6) {
        // Final submission
        console.log("Final submission with data:", data)
        
        // Validate required documents are uploaded
        if (!idCardFile || !proofOfFundsFile) {
          throw new Error("Please upload both ID card and proof of funds documents")
        }

        const loanDetails = calculateLoanDetails(watchedValues.amount, watchedValues.duration)
        console.log("Loan details calculated:", loanDetails)
        
        // Create form data with all fields and documents
        const formData = new FormData()
        
        // Add all form fields
        formData.append("amount", data.amount.toString())
        formData.append("purpose", data.purpose)
        formData.append("duration", data.duration.toString())
        formData.append("monthlyIncome", data.monthlyIncome.toString())
        formData.append("employmentStatus", data.employmentStatus)
        if (data.employerName) formData.append("employerName", data.employerName)
        if (data.workExperience) formData.append("workExperience", data.workExperience.toString())
        formData.append("phoneNumber", data.phoneNumber)
        formData.append("address", data.address)
        formData.append("accountNumber", data.accountNumber)
        formData.append("bankName", data.bankName)
        if (data.bvn) formData.append("bvn", data.bvn)
        if (data.nin) formData.append("nin", data.nin)
        formData.append("interestRate", loanDetails.annualRate.toString())
        
        // Add documents
        formData.append("idCard", idCardFile)
        formData.append("idCardType", selectedIdCardType)
        formData.append("proofOfFunds", proofOfFundsFile)

        console.log("Sending request to /api/applications")

        const response = await fetch("/api/applications", {
          method: "POST",
          body: formData,
        })

        console.log("Response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error occurred" }))
          throw new Error(errorData.error || `Failed to submit application (${response.status})`)
        }

        const responseData = await response.json()
        console.log("Success response:", responseData)

        setSuccess("Loan application submitted successfully! Your application is now under review.")
        // Redirect to applications page after a short delay
        setTimeout(() => {
          window.location.href = "/applicant/applications"
        }, 2000)
      }
    } catch (err) {
      console.error("Submission error:", err)
      setError(err instanceof Error ? err.message : "Failed to submit application")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextStep = async () => {
    console.log("Next step clicked, current step:", currentStep)
    
    // Trigger validation for current step
    const stepValid = await validateCurrentStep()
    
    if (stepValid && currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        return await trigger(["phoneNumber", "address"])
      case 2:
        return await trigger(["amount", "purpose", "duration"])
      case 3:
        return await trigger(["monthlyIncome", "employmentStatus"])
      case 4:
        return true // Documents step just shows information
      case 5:
        return await trigger(["accountNumber", "bankName"])
      case 6:
        return idCardFile !== null && proofOfFundsFile !== null
      default:
        return false
    }
  }

  const fetchInterestRates = async () => {
    try {
      const response = await fetch("/api/interest-rates/available")
      if (!response.ok) throw new Error("Failed to fetch interest rates")
      
      const data = await response.json()
      setInterestRates(data.interestRates || [])
    } catch (err) {
      console.error("Failed to fetch interest rates:", err)
      // Set default rates if API fails
      setInterestRates([
        { months: 6, rate: 15.5 },
        { months: 12, rate: 16.0 },
        { months: 18, rate: 16.5 },
        { months: 24, rate: 17.0 }
      ])
    } finally {
      setLoadingRates(false)
    }
  }

  const getInterestRate = (months: number) => {
    // Find the exact match or the closest lower duration
    const exactMatch = interestRates.find(rate => rate.months === months)
    if (exactMatch) return exactMatch.rate

    // If no exact match, find the closest lower duration
    const lowerRates = interestRates.filter(rate => rate.months <= months)
    if (lowerRates.length > 0) {
      const closest = lowerRates[lowerRates.length - 1]
      return closest.rate
    }

    // Default rate if no matches found
    return 15.5
  }

  const calculateLoanDetails = (amount: number, duration: number) => {
    if (!amount || !duration) {
      return {
        principal: 0,
        annualRate: 0,
        monthlyRate: 0,
        totalInterest: 0,
        totalRepayment: 0,
        monthlyPayment: 0,
        duration: 0
      }
    }

    const annualRate = getInterestRate(duration)
    const monthlyRate = annualRate / 100 / 12
    const totalInterest = amount * (annualRate / 100) 
    const totalRepayment = amount + totalInterest
    const monthlyPayment = totalRepayment / duration

    return {
      principal: amount,
      annualRate,
      monthlyRate,
      totalInterest,
      totalRepayment,
      monthlyPayment,
      duration
    }
  }

  useEffect(() => {
    fetchInterestRates()
  }, [])

  const steps = [
    { id: 1, name: "Personal Information", description: "Your basic details" },
    { id: 2, name: "Loan Details", description: "Loan amount and purpose" },
    { id: 3, name: "Employment Information", description: "Your employment details" },
    { id: 4, name: "Document Requirements", description: "Required documents overview" },
    { id: 5, name: "Account Details", description: "Bank account information" },
    { id: 6, name: "Review & Submit", description: "Review and submit application" },
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
        return true
      case 5:
        return watchedValues.accountNumber && watchedValues.bankName
      case 6:
        return idCardFile && proofOfFundsFile
      default:
        return false
    }
  }

  return (
    <DashboardLayout requiredRoles={[UserRole.APPLICANT, UserRole.SUPER_ADMIN]}>
      <div className="max-w-4xl mx-auto overflow-hidden space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply for Loan</h1>
          <p className="text-muted-foreground">
            Complete your loan application in just a few steps.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
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
              <div className="grid grid-cols-6 gap-2">
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
                    <Select onValueChange={(value) => setValue("duration", parseInt(value), { shouldValidate: true })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {interestRates.map((rate) => (
                          <SelectItem key={rate.months} value={rate.months.toString()}>
                            {rate.months} months
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={(value) => setValue("employmentStatus", value as any, { shouldValidate: true })}>
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
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>
                  You will upload the required documents in the final step.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <strong>Note:</strong> Document upload has been moved to the final summary step. 
                      You will upload your ID card and proof of funds after reviewing all your application details.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">ID Card Required</h4>
                      <p className="text-sm text-gray-600">
                        You will need to upload a valid government-issued ID card (National ID, Voter's Card, International Passport, or Driver's License).
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Proof of Funds Required</h4>
                      <p className="text-sm text-gray-600">
                        You will need to upload a recent bank statement or proof of income to verify your financial capacity.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Account Details */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>
                  Please provide your bank account information for disbursement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder="1234567890"
                      {...register("accountNumber")}
                    />
                    {errors.accountNumber && (
                      <p className="text-sm text-red-500 mt-1">{errors.accountNumber.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder="First Bank of Nigeria"
                      {...register("bankName")}
                    />
                    {errors.bankName && (
                      <p className="text-sm text-red-500 mt-1">{errors.bankName.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
                    <Input
                      id="bvn"
                      placeholder="12345678901"
                      {...register("bvn")}
                    />
                    {errors.bvn && (
                      <p className="text-sm text-red-500 mt-1">{errors.bvn.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="nin">National Identification Number (NIN)</Label>
                    <Input
                      id="nin"
                      placeholder="12345678901"
                      {...register("nin")}
                    />
                    {errors.nin && (
                      <p className="text-sm text-red-500 mt-1">{errors.nin.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Review & Submit */}
          {currentStep === 6 && (
            <div className="space-y-6">
              {/* Personal Information Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium">{watchedValues.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{watchedValues.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loan Details Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Loan Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Loan Amount</p>
                      <p className="font-medium">₦{watchedValues.amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium">{watchedValues.duration} months</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Purpose</p>
                      <p className="font-medium">{watchedValues.purpose}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employment Information Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Employment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Employment Status</p>
                      <p className="font-medium">{watchedValues.employmentStatus?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monthly Income</p>
                      <p className="font-medium">₦{watchedValues.monthlyIncome?.toLocaleString()}</p>
                    </div>
                    {watchedValues.employerName && (
                      <div>
                        <p className="text-sm text-gray-500">Employer Name</p>
                        <p className="font-medium">{watchedValues.employerName}</p>
                      </div>
                    )}
                    {watchedValues.workExperience && (
                      <div>
                        <p className="text-sm text-gray-500">Work Experience</p>
                        <p className="font-medium">{watchedValues.workExperience} years</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Details Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="font-medium">{watchedValues.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bank Name</p>
                      <p className="font-medium">{watchedValues.bankName}</p>
                    </div>
                    {watchedValues.bvn && (
                      <div>
                        <p className="text-sm text-gray-500">BVN</p>
                        <p className="font-medium">{watchedValues.bvn}</p>
                      </div>
                    )}
                    {watchedValues.nin && (
                      <div>
                        <p className="text-sm text-gray-500">NIN</p>
                        <p className="font-medium">{watchedValues.nin}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Loan Calculation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Loan Calculation</CardTitle>
                  <CardDescription>
                    Based on the current interest rates, here's your loan breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingRates ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Calculating loan details...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const loanDetails = calculateLoanDetails(watchedValues.amount, watchedValues.duration)
                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-600">Principal Amount</p>
                                <p className="text-2xl font-bold text-blue-900">₦{loanDetails.principal.toLocaleString()}</p>
                              </div>
                              <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600">Interest Rate</p>
                                <p className="text-2xl font-bold text-green-900">{loanDetails.annualRate}%</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 bg-yellow-50 rounded-lg">
                                <p className="text-sm text-yellow-600">Total Interest</p>
                                <p className="text-xl font-bold text-yellow-900">₦{loanDetails.totalInterest.toLocaleString()}</p>
                              </div>
                              <div className="p-4 bg-purple-50 rounded-lg">
                                <p className="text-sm text-purple-600">Total Repayment</p>
                                <p className="text-xl font-bold text-purple-900">₦{loanDetails.totalRepayment.toLocaleString()}</p>
                              </div>
                              <div className="p-4 bg-orange-50 rounded-lg">
                                <p className="text-sm text-orange-600">Monthly Payment</p>
                                <p className="text-xl font-bold text-orange-900">₦{loanDetails.monthlyPayment.toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium mb-2">Payment Schedule</h4>
                              <p className="text-sm text-gray-600">
                                You will pay <strong>₦{loanDetails.monthlyPayment.toLocaleString()}</strong> per month for 
                                <strong> {loanDetails.duration} months</strong>, starting from the loan disbursement date.
                              </p>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle>Terms and Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>• By submitting this application, you agree to the terms and conditions of AOPE Credit.</p>
                    <p>• All information provided is accurate and complete to the best of your knowledge.</p>
                    <p>• You authorize AOPE Credit to verify the information provided.</p>
                    <p>• The interest rate is subject to change based on market conditions and your credit profile.</p>
                    <p>• Late payments may incur additional charges and affect your credit score.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Document Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Required Documents
                  </CardTitle>
                  <CardDescription>
                    Upload both required documents to complete your loan application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">ID Card Type</label>
                    <Select value={selectedIdCardType} onValueChange={(value) => setSelectedIdCardType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID card type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NATIONAL_ID">National ID Card</SelectItem>
                        <SelectItem value="VOTERS_CARD">Voters Card</SelectItem>
                        <SelectItem value="INTERNATIONAL_PASSPORT">International Passport</SelectItem>
                        <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">ID Card</label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                        disabled={isSubmitting}
                        className="hidden"
                        id="idCardInput"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('idCardInput')?.click()}
                        disabled={isSubmitting}
                        className="w-full"
                        variant={idCardFile ? "outline" : "default"}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {idCardFile ? idCardFile.name : "Select ID Card"}
                      </Button>
                      {idCardFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIdCardFile(null)}
                          className="mt-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Proof of Funds</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setProofOfFundsFile(e.target.files?.[0] || null)}
                        disabled={isSubmitting}
                        className="hidden"
                        id="proofOfFundsInput"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('proofOfFundsInput')?.click()}
                        disabled={isSubmitting}
                        className="w-full"
                        variant={proofOfFundsFile ? "outline" : "default"}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {proofOfFundsFile ? proofOfFundsFile.name : "Select Proof of Funds"}
                      </Button>
                      {proofOfFundsFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setProofOfFundsFile(null)}
                          className="mt-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  {(!idCardFile || !proofOfFundsFile) && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please upload both required documents (ID Card and Proof of Funds) to submit your application.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex mt-4 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1 || isSubmitting}
            >
              Previous
            </Button>
            
            <div className="space-x-2">
              {currentStep < 6 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep() || isSubmitting}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !idCardFile || !proofOfFundsFile}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}