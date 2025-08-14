"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Plus, Edit, Trash2, Percent, Calendar } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const interestRateSchema = z.object({
  months: z.number().min(1, "Minimum duration is 1 month").max(60, "Maximum duration is 60 months"),
  rate: z.number().min(0, "Rate cannot be negative").max(100, "Rate cannot exceed 100%"),
})

type InterestRateFormData = z.infer<typeof interestRateSchema>

interface InterestRate {
  id: string
  months: number
  rate: number
  isActive: boolean
  createdAt: string
  admin: {
    id: string
    name: string
    email: string
  }
}

export default function InterestRatesPage() {
  const [interestRates, setInterestRates] = useState<InterestRate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InterestRateFormData>({
    resolver: zodResolver(interestRateSchema),
    defaultValues: {
      months: 12,
      rate: 15.5,
    }
  })

  const fetchInterestRates = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/interest-rates")
      if (!response.ok) throw new Error("Failed to fetch interest rates")
      
      const data = await response.json()
      setInterestRates(data.interestRates)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch interest rates")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: InterestRateFormData) => {
    setIsCreating(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch("/api/interest-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create interest rate")
      }

      const result = await response.json()
      setSuccess("Interest rate saved successfully!")
      reset()
      await fetchInterestRates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save interest rate")
    } finally {
      setIsCreating(false)
    }
  }

  const deleteInterestRate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this interest rate?")) return

    try {
      const response = await fetch(`/api/interest-rates/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete interest rate")
      }

      setSuccess("Interest rate deleted successfully!")
      await fetchInterestRates()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete interest rate")
    }
  }

  useEffect(() => {
    fetchInterestRates()
  }, [])

  return (
    <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interest Rate Management</h1>
          <p className="text-muted-foreground">
            Configure interest rates for different loan durations.
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create/Edit Interest Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Set Interest Rate
              </CardTitle>
              <CardDescription>
                Configure interest rate for a specific loan duration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="months">Loan Duration (months)</Label>
                  <Input
                    id="months"
                    type="number"
                    placeholder="12"
                    {...register("months", { valueAsNumber: true })}
                  />
                  {errors.months && (
                    <p className="text-sm text-red-500 mt-1">{errors.months.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="rate">Interest Rate (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.1"
                    placeholder="15.5"
                    {...register("rate", { valueAsNumber: true })}
                  />
                  {errors.rate && (
                    <p className="text-sm text-red-500 mt-1">{errors.rate.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isCreating}
                  className="w-full"
                >
                  <Percent className="h-4 w-4 mr-2" />
                  {isCreating ? "Saving..." : "Save Interest Rate"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Interest Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Current Interest Rates
              </CardTitle>
              <CardDescription>
                View and manage all configured interest rates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading interest rates...</p>
                </div>
              ) : interestRates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No interest rates configured yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {interestRates.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Percent className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{rate.months} months</p>
                          <p className="text-sm text-gray-500">
                            {rate.rate}% interest rate
                          </p>
                          <p className="text-xs text-gray-400">
                            Set by {rate.admin.name} on {new Date(rate.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={rate.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {rate.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteInterestRate(rate.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>How Interest Rates Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Interest rates</strong> are applied based on the loan duration selected by applicants.
              </p>
              <p>
                <strong>Calculation:</strong> The interest is calculated as a simple annual percentage rate (APR) 
                applied to the principal amount for the loan duration.
              </p>
              <p>
                <strong>Example:</strong> For a ₦100,000 loan at 27% APR for 12 months:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Annual interest: ₦100,000 × 27% = ₦27,000</li>
                <li>Monthly interest: ₦27,000 ÷ 12 = ₦2,250</li>
                <li>Total repayment: ₦100,000 + ₦27,000 = ₦127,000</li>
                <li>Monthly payment: ₦127,000 ÷ 12 = ₦10,583.33</li>
              </ul>
              <p>
                Applicants will see the calculated interest and monthly payments before submitting their application.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}