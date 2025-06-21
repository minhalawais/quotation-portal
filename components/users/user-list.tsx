"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { logActivity } from "@/lib/logger"
import { Edit, Trash2, Users, Plus } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  role: string
  contact?: string
  createdAt: string
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (userId: string) => {
    router.push(`/users/edit/${userId}`)
  }

  const deleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete "${user.name}"?`)) return

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers(users.filter((u) => u._id !== user._id))

        // Log delete activity
        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "DELETE",
            resource: "User",
            resourceId: user._id,
            details: `Deleted user: ${user.name} (${user.role})`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "User deleted successfully",
        })
      }
    } catch (error) {
      // Log error activity
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "DELETE",
          resource: "User",
          resourceId: user._id,
          details: `Failed to delete user: ${user.name}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const getRoleColor = (role: string) => {
    return role === "manager"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-green-100 text-green-800 border-green-200"
  }

  const UserIcon = ({ name }: { name: string }) => {
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-lg">{name.charAt(0).toUpperCase()}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {users.map((user) => (
        <Card key={user._id} className="card-hover bg-white shadow-sm border-0">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <UserIcon name={user.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>
              </div>
              <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
            </div>

            {user.contact && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Contact:</span> {user.contact}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</span>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(user._id)}
                  className="hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all duration-200"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteUser(user)}
                  className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {users.length === 0 && (
        <div className="col-span-full">
          <Card className="p-8 lg:p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-2 border-gray-300">
            <Users className="mx-auto h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mb-4" />
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-4 lg:mb-6">Add your first user to get started.</p>
            <Button
              onClick={() => router.push("/users/add")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First User
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
