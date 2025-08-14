"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { UserRole } from "@prisma/client"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { SuspenseWrapper } from "@/components/ui/suspense-wrapper"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
}

export function DashboardLayout({ children, requiredRoles }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/")
      return
    }

    if (requiredRoles && !requiredRoles.includes(session.user.role)) {
      router.push("/unauthorized")
      return
    }
  }, [session, status, router, requiredRoles])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userRole={session.user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <SuspenseWrapper>
              {children}
            </SuspenseWrapper>
          </div>
        </main>
      </div>
    </div>
  )
}