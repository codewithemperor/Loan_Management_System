"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { UserRole } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, Users, TrendingUp, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    // Only redirect if user is already logged in
    if (session) {
      // Redirect based on user role
      switch (session.user.role) {
        case UserRole.SUPER_ADMIN:
          router.push("/admin")
          break
        case UserRole.LOAN_OFFICER:
          router.push("/officer")
          break
        case UserRole.APPROVER:
          router.push("/approver")
          break
        case UserRole.APPLICANT:
          router.push("/applicant")
          break
        default:
          router.push("/unauthorized")
      }
    }
  }, [session, status, router])

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  // If user is logged in, show loading while redirecting
  if (session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600"></div>
      </div>
    )
  }

  // If no session, show the landing page
  const features = [
    {
      icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
      title: "Fast Processing",
      description: "Quick loan approval and processing with our streamlined system"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Secure & Reliable",
      description: "Bank-level security for all your financial data and transactions"
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Expert Support",
      description: "Professional loan officers and approvers to guide you through the process"
    }
  ]

  const roles = [
    {
      title: "Applicants",
      description: "Apply for loans with ease and track your application status",
      color: "bg-blue-100 text-blue-800",
      link: "/applicant/login"
    },
    {
      title: "Loan Officers",
      description: "Manage and process loan applications efficiently",
      color: "bg-green-100 text-green-800",
      link: "/officer/login"
    },
    {
      title: "Approvers",
      description: "Review and approve loan applications with confidence",
      color: "bg-purple-100 text-purple-800",
      link: "/approver/login"
    },
    {
      title: "Administrators",
      description: "Oversee the entire loan management system",
      color: "bg-orange-100 text-orange-800",
      link: "/admin/login"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <Image
                  src="/logo.png"
                  alt="AOPE Credit Logo"
                  width={140}
                  height={140}
                  className="relative rounded-2xl shadow-2xl border-4 border-white/50 backdrop-blur-sm"
                />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 animate-fade-in">
              AOPE Credit
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Professional Loan Management System - Streamlining the lending process with cutting-edge technology
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <Link href="/applicant/login">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <Link href="#learn-more">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="learn-more" className="py-20 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-4">
              Why Choose AOPE Credit?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Experience the future of loan management with our comprehensive platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent mb-4">
              Built for Every Role
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Tailored experience for every user in the loan management ecosystem
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, index) => (
              <Card key={index} className="hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <Badge className={`w-fit text-sm font-semibold px-4 py-2 ${role.color} shadow-md`}>
                    {role.title}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600 leading-relaxed mb-4">
                    {role.description}
                  </CardDescription>
                  <Button 
                    size="sm" 
                    className="w-full"
                    asChild
                  >
                    <Link href={role.link}>
                      Login as {role.title}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-6">
                Professional Team, Exceptional Service
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our dedicated team of loan officers and approvers work together to provide you with the best lending experience. With years of expertise in the financial industry, we ensure that every application is handled with care and professionalism.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 hover:bg-blue-100/50 transition-colors">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Expert loan officers with industry experience</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50/50 hover:bg-purple-100/50 transition-colors">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Rigorous approval process for quality assurance</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50/50 hover:bg-indigo-100/50 transition-colors">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">24/7 support for all your needs</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
              <Image
                src="/team-work.png"
                alt="Professional team working"
                width={500}
                height={400}
                className="relative rounded-2xl shadow-2xl border-4 border-white/50 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of satisfied users who have streamlined their loan management process with AOPE Credit
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              asChild
            >
              <Link href="/applicant/login">
                Apply for Loan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              asChild
            >
              <Link href="/admin/login">
                Staff Login
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AOPE Credit</h3>
              <p className="text-gray-300 mt-2">Professional Loan Management System</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">&copy; 2024 AOPE Credit. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}