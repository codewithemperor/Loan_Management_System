"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { SuspenseWrapper, StatsSuspense, TableSuspense } from "@/components/ui/suspense-wrapper"
import { AdminDashboard } from "./admin-dashboard"

export default function AdminPage() {
  return (
    <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
      <SuspenseWrapper fallback={<StatsSuspense />}>
        <AdminDashboard />
      </SuspenseWrapper>
    </DashboardLayout>
  )
}