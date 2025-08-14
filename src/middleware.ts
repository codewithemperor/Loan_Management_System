import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { UserRole } from "@prisma/client"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl
    
    // Define role mappings and permissions
    const roleConfig = {
      admin: {
        role: UserRole.SUPER_ADMIN,
        loginPath: "/admin/login",
        basePath: "/admin",
        hasAccess: (userRole: string) => userRole === UserRole.SUPER_ADMIN
      },
      officer: {
        role: UserRole.LOAN_OFFICER,
        loginPath: "/officer/login",
        basePath: "/officer",
        hasAccess: (userRole: string) => userRole === UserRole.LOAN_OFFICER || userRole === UserRole.SUPER_ADMIN
      },
      approver: {
        role: UserRole.APPROVER,
        loginPath: "/approver/login",
        basePath: "/approver",
        hasAccess: (userRole: string) => userRole === UserRole.APPROVER || userRole === UserRole.SUPER_ADMIN
      },
      applicant: {
        role: UserRole.APPLICANT,
        loginPath: "/applicant/login",
        basePath: "/applicant",
        hasAccess: (userRole: string) => userRole === UserRole.APPLICANT || userRole === UserRole.SUPER_ADMIN
      }
    }

    // Check each role's login and access rules
    for (const [roleName, config] of Object.entries(roleConfig)) {
      // If accessing the login page for this role
      if (pathname === config.loginPath) {
        if (token) {
          // User is already logged in, redirect to their appropriate dashboard
          const userRole = token.role as string
          
          // Find which role this user belongs to and redirect to their dashboard
          for (const [targetRoleName, targetConfig] of Object.entries(roleConfig)) {
            if (userRole === targetConfig.role || 
                (userRole === UserRole.SUPER_ADMIN && targetRoleName !== 'applicant') ||
                (userRole === UserRole.LOAN_OFFICER && targetRoleName === 'officer') ||
                (userRole === UserRole.APPROVER && targetRoleName === 'approver') ||
                (userRole === UserRole.APPLICANT && targetRoleName === 'applicant')) {
              return NextResponse.redirect(new URL(targetConfig.basePath, req.url))
            }
          }
          
          // If no specific role match, redirect to home
          return NextResponse.redirect(new URL("/", req.url))
        }
        // Allow access to login page if not logged in
        return NextResponse.next()
      }
      
      // If accessing a protected path for this role
      if (pathname.startsWith(config.basePath)) {
        if (!token) {
          // Not authenticated, redirect to this role's login page
          return NextResponse.redirect(new URL(config.loginPath, req.url))
        }
        
        if (!config.hasAccess(token.role as string)) {
          // Authenticated but not authorized for this role's area
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
      }
    }

    // If accessing dashboard root without specific role prefix
    if (pathname.startsWith("/dashboard")) {
      if (!token) {
        return NextResponse.redirect(new URL("/", req.url))
      }
      
      // Redirect to appropriate role dashboard
      const userRole = token.role as string
      for (const [roleName, config] of Object.entries(roleConfig)) {
        if (config.hasAccess(userRole) && userRole === config.role) {
          return NextResponse.redirect(new URL(config.basePath, req.url))
        }
      }
    }

    // If not authenticated and not accessing a login page, redirect to home
    if (!token && !Object.values(roleConfig).some(config => pathname === config.loginPath)) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Allow middleware to handle all authorization logic
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/officer/:path*",
    "/approver/:path*",
    "/applicant/:path*",
    "/dashboard/:path*"
  ],
}