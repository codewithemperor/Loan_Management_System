import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, ArrowLeft } from "lucide-react"

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <ShieldX className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Unauthorized Access</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please contact your administrator if you believe this is an error.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/signin">Sign in with different account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}