import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, Users, TrendingUp, Shield, Building2, HandCoins, FileText, BarChart3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  const services = [
    {
      icon: <HandCoins className="h-8 w-8 text-primary" />,
      title: "Personal Loans",
      description: "Quick and easy personal loans for your immediate financial needs"
    },
    {
      icon: <Building2 className="h-8 w-8 text-primary" />,
      title: "Business Loans",
      description: "Grow your business with our flexible business loan solutions"
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Loan Processing",
      description: "Streamlined application process with fast approval times"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Financial Analytics",
      description: "Comprehensive tracking and analysis of your loan portfolio"
    }
  ]

  const stats = [
    {
      title: "2 Million+",
      subtitle: "Loans Processed Annually",
      color: "text-primary"
    },
    {
      title: "98%",
      subtitle: "Customer Satisfaction Rate",
      color: "text-secondary"
    },
    {
      title: "150+",
      subtitle: "Global Partners & Networks",
      color: "text-accent"
    }
  ]

  const roles = [
    {
      title: "Applicants",
      description: "Apply for loans with ease and track your application status",
      color: "bg-primary/10 text-primary border-primary",
      link: "/applicant/login"
    },
    {
      title: "Loan Officers",
      description: "Manage and process loan applications efficiently",
      color: "bg-secondary/10 text-secondary border-secondary",
      link: "/officer/login"
    },
    {
      title: "Approvers",
      description: "Review and approve loan applications with confidence",
      color: "bg-accent/10 text-accent border-accent",
      link: "/approver/login"
    },
    {
      title: "Administrators",
      description: "Oversee the entire loan management system",
      color: "bg-gray-100 text-gray-800 border-gray-300",
      link: "/admin/login"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Small Business Owner",
      content: "AOPE Credit helped me expand my business with their quick loan approval process. Excellent service!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Individual Applicant",
      content: "The most reliable loan management system I've ever used. Fast, secure, and user-friendly.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Financial Advisor",
      content: "I recommend AOPE Credit to all my clients. Their professional approach is unmatched.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-blue-50/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent"></div>
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex justify-start mb-6">
                <Badge className="bg-primary text-white px-4 py-2 text-sm font-semibold">
                  Trusted Financial Partner
                </Badge>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Your Global
                <span className="text-primary"> Loan</span>
                <br />
                Management Partner
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                Professional loan management solutions with cutting-edge technology and exceptional service.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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
                  className="px-8 py-4 text-lg border-2 border-primary text-primary hover:bg-primary/50 hover:border-primary-dark font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  asChild
                >
                  <Link href="#services">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="grid grid-cols-3 gap-6 text-center">
                  {stats.map((stat, index) => (
                    <div key={index} className="p-4">
                      <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                        {stat.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {stat.subtitle}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Loan Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Comprehensive financial solutions tailored to meet your needs
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      {service.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600 leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary-dark to-accent">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="text-white">
                <div className="text-5xl md:text-6xl font-bold mb-4">
                  {stat.title}
                </div>
                <div className="text-xl opacity-90">
                  {stat.subtitle}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Every Role
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Tailored experience for every user in the loan management ecosystem
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, index) => (
              <Card key={index} className="hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 bg-white">
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

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Trusted by thousands of satisfied customers worldwide
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-2xl transition-all duration-300 border-0 bg-gray-50">
                <CardContent>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-white to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Why Choose AOPE Credit?
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our dedicated team of financial experts work together to provide you with the best lending experience. With years of expertise in the financial industry, we ensure that every application is handled with care and professionalism.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Expert loan officers with industry experience</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5 hover:bg-secondary/10 transition-colors">
                  <CheckCircle className="h-6 w-6 text-secondary flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Rigorous approval process for quality assurance</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
                  <CheckCircle className="h-6 w-6 text-accent flex-shrink-0" />
                  <span className="text-gray-700 font-medium">24/7 support for all your financial needs</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
                  <p className="text-gray-600 mb-6">
                    Join thousands of satisfied users who have streamlined their loan management process with AOPE Credit
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      className="bg-primary hover:bg-primary-dark text-white"
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
                      className="border-2 border-primary text-primary hover:bg-primary/50"
                      asChild
                    >
                      <Link href="/admin/login">
                        Staff Login
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold text-primary">AOPE Credit</h3>
              <p className="text-gray-300 mt-2">Professional Loan Management System</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">&copy; {new Date().getFullYear()} AOPE Credit. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}