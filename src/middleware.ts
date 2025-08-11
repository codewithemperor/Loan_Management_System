import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { UserRole } from "@prisma/client"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === UserRole.SUPER_ADMIN
    const isOfficer = token?.role === UserRole.LOAN_OFFICER
    const isApprover = token?.role === UserRole.APPROVER
    const isApplicant = token?.role === UserRole.APPLICANT

    const { pathname } = req.nextUrl

    // Role-based route protection
    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if (pathname.startsWith("/officer") && !isOfficer && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if (pathname.startsWith("/approver") && !isApprover && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    if (pathname.startsWith("/applicant") && !isApplicant && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/officer/:path*",
    "/approver/:path*",
    "/applicant/:path*",
    "/dashboard/:path*"
  ]
}