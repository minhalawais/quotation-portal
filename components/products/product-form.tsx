"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2, ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"
import { logActivity } from "@/lib/logger"

export default function ProductForm() {
  const [formData, setFormData] = useState({
    group: "",
    subGroup: "",
    productId: "",
    name: "",
    quantity: "",
    price: "",
  })
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imagePath = ""

      if (image) {
        const imageFormData = new FormData()
        imageFormData.append("file", image)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imagePath = uploadData.path
        }
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          quantity: Number.parseInt(formData.quantity),
          price: Number.parseFloat(formData.price),
          imagePath,
        }),
      })

      if (response.ok) {
        // Log activity
        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "CREATE",
            resource: "Product",
            details: `Created new product: ${formData.name}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "Product added successfully",
        })
        router.push("/products")
      } else {
        throw new Error("Failed to add product")
      }
    } catch (error) {
      // Log error activity
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "CREATE",
          resource: "Product",
          details: `Failed to create product: ${formData.name}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          Add New Product
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select value={formData.group} onValueChange={(value) => setFormData({ ...formData, group: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hosiery">Hosiery</SelectItem>
                  <SelectItem value="garments">Garments</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subGroup">Sub-Group</Label>
              <Input
                id="subGroup"
                value={formData.subGroup}
                onChange={(e) => setFormData({ ...formData, subGroup: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product ID</Label>
              <Input
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (PKR)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Product Image</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <Upload className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Product"
              )}
            </Button>

            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
