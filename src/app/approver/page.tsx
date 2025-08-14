"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { SuspenseWrapper, StatsSuspense } from "@/components/ui/suspense-wrapper"
import ApproverDashboard  from "./approver-dashboard"

export default function ApproverPage() {
  return (
    <DashboardLayout requiredRoles={[UserRole.APPROVER, UserRole.SUPER_ADMIN]}>
      <SuspenseWrapper fallback={<StatsSuspense />}>
        <ApproverDashboard />
      </SuspenseWrapper>
    </DashboardLayout>
  )
}