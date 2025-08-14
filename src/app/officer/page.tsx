"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { SuspenseWrapper, StatsSuspense, TableSuspense } from "@/components/ui/suspense-wrapper"
import OfficerDashboard  from "./officer-dashboard"

export default function OfficerPage() {
  return (
    <DashboardLayout requiredRoles={[UserRole.LOAN_OFFICER, UserRole.SUPER_ADMIN]}>
      <SuspenseWrapper fallback={<StatsSuspense />}>
        <OfficerDashboard />
      </SuspenseWrapper>
    </DashboardLayout>
  )
}