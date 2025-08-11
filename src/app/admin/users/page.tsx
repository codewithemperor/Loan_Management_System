"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Edit,
  Eye
} from "lucide-react"
import { format } from "date-fns"

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phoneNumber?: string
  address?: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  lastLogin?: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const roleColors = {
  SUPER_ADMIN: "purple",
  LOAN_OFFICER: "blue",
  APPROVER: "green",
  APPLICANT: "orange",
}

const roleLabels = {
  SUPER_ADMIN: "Super Admin",
  LOAN_OFFICER: "Loan Officer",
  APPROVER: "Approver",
  APPLICANT: "Applicant",
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "APPLICANT" as UserRole,
    phoneNumber: "",
    address: "",
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      })

      if (roleFilter !== "all") {
        params.append("role", roleFilter)
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to load users. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, roleFilter, statusFilter])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.phoneNumber?.includes(searchTerm)
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.isActive) ||
                         (statusFilter === "inactive" && !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        setShowAddUserDialog(false)
        setNewUser({
          name: "",
          email: "",
          role: "APPLICANT",
          phoneNumber: "",
          address: "",
        })
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Failed to create user. Please try again.")
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchUsers()
      } else {
        alert("Failed to update user status")
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      alert("Failed to update user status. Please try again.")
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchUsers}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRoles={[UserRole.SUPER_ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users and their roles in the AOPE Credit system.
            </p>
          </div>
          <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. The user will receive an email with login instructions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as UserRole }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.LOAN_OFFICER}>Loan Officer</SelectItem>
                      <SelectItem value={UserRole.APPROVER}>Approver</SelectItem>
                      <SelectItem value={UserRole.APPLICANT}>Applicant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phoneNumber" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={newUser.phoneNumber}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={newUser.address}
                    onChange={(e) => setNewUser(prev => ({ ...prev, address: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser}>
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(user => user.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loan Officers</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(user => user.role === UserRole.LOAN_OFFICER).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Active loan officers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approvers</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(user => user.role === UserRole.APPROVER).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Active approvers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Users</CardTitle>
            <CardDescription>
              Search and filter system users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                    <SelectItem value={UserRole.LOAN_OFFICER}>Loan Officer</SelectItem>
                    <SelectItem value={UserRole.APPROVER}>Approver</SelectItem>
                    <SelectItem value={UserRole.APPLICANT}>Applicant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <CardDescription>
              Manage all users in the AOPE Credit system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || roleFilter !== "all" || statusFilter !== "all" 
                    ? "Try adjusting your filters or search terms."
                    : "No users have been created yet."
                  }
                </p>
                <Button onClick={() => setShowAddUserDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First User
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{user.email}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={
                                roleColors[user.role] === "purple" ? "border-purple-500 text-purple-700" :
                                roleColors[user.role] === "blue" ? "border-blue-500 text-blue-700" :
                                roleColors[user.role] === "green" ? "border-green-500 text-green-700" :
                                "border-orange-500 text-orange-700"
                              }
                            >
                              {roleLabels[user.role]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {user.phoneNumber && (
                                <div className="text-sm flex items-center space-x-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{user.phoneNumber}</span>
                                </div>
                              )}
                              {user.address && (
                                <div className="text-sm flex items-center space-x-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-xs">{user.address}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {user.isActive ? (
                                <Badge variant="default" className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Inactive
                                </Badge>
                              )}
                              {user.emailVerified && (
                                <Badge variant="outline" className="text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.createdAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                className={
                                  user.isActive 
                                    ? "text-red-600 border-red-600 hover:bg-red-50" 
                                    : "text-green-600 border-green-600 hover:bg-green-50"
                                }
                              >
                                {user.isActive ? (
                                  <>
                                    <Ban className="w-4 h-4 mr-1" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}