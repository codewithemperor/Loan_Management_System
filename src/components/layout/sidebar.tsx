"use client"

import { UserRole } from "@prisma/client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  CreditCard,
  CheckCircle,
  UserCheck,
  Shield,
  LogOut,
  Menu,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"

interface SidebarProps {
  userRole: UserRole
}

const navigation = {
  [UserRole.SUPER_ADMIN]: [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Staff Management", href: "/admin/staff", icon: Shield },
    { name: "All Applications", href: "/admin/applications", icon: FileText },
    { name: "Loans", href: "/admin/loans", icon: CreditCard },
    { name: "Interest Rates", href: "/admin/interest-rates", icon: Settings },
  ],
  [UserRole.LOAN_OFFICER]: [
    { name: "Dashboard", href: "/officer", icon: LayoutDashboard },
    { name: "Applications", href: "/officer/applications", icon: FileText },
    { name: "My Reviews", href: "/officer/review", icon: CheckCircle },
  ],
  [UserRole.APPROVER]: [
    { name: "Dashboard", href: "/approver", icon: LayoutDashboard },
    { name: "Pending Approvals", href: "/approver/pending", icon: CheckCircle },
    { name: "Approved Loans", href: "/approver/approved", icon: CreditCard },
    { name: "Disbursed Loans", href: "/approver/disbursed", icon: DollarSign },
  ],
  [UserRole.APPLICANT]: [
    { name: "Dashboard", href: "/applicant", icon: LayoutDashboard },
    { name: "Apply for Loan", href: "/applicant/apply", icon: FileText },
    { name: "My Applications", href: "/applicant/applications", icon: CreditCard },
    { name: "My Loans", href: "/applicant/loans", icon: UserCheck },
  ],
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const userNavigation = navigation[userRole] || []

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-gray-800 overflow-y-auto border-r">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="h-8 w-auto">
            <div className="text-xl font-bold text-primary">AOPE Credit</div>
          </div>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {userNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white",
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500",
                      "mr-3 flex-shrink-0 h-6 w-6"
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {session?.user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userRole.replace("_", " ")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}