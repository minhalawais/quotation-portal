"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import Image from "next/image"

interface Product {
  _id: string
  group: string
  subGroup: string
  productId: string
  name: string
  quantity: number
  price: number
  imagePath?: string
}

interface EditProductFormProps {
  productId: string
}

export default function EditProductForm({ productId }: EditProductFormProps) {
  const [formData, setFormData] = useState({
    group: "",
    subGroup: "",
    productId: "",
    name: "",
    quantity: "",
    price: "",
  })
  const [currentImagePath, setCurrentImagePath] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const product: Product = await response.json()
        setFormData({
          group: product.group,
          subGroup: product.subGroup,
          productId: product.productId,
          name: product.name,
          quantity: product.quantity.toString(),
          price: product.price.toString(),
        })
        setCurrentImagePath(product.imagePath || "")
      } else {
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive",
        })
        router.push("/products")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch product",
        variant: "destructive",
      })
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imagePath = currentImagePath

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

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
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
            action: "UPDATE",
            resource: "Product",
            resourceId: productId,
            details: `Updated product: ${formData.name}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "Product updated successfully",
        })
        router.push("/products")
      } else {
        throw new Error("Failed to update product")
      }
    } catch (error) {
      // Log error activity
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "UPDATE",
          resource: "Product",
          resourceId: productId,
          details: `Failed to update product: ${formData.name}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          Edit Product Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Image Preview */}
          {currentImagePath && (
            <div className="space-y-2">
              <Label>Current Image</Label>
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={currentImagePath || "/placeholder.svg"}
                  alt="Current product"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

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
            <Label htmlFor="image">Update Product Image (Optional)</Label>
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
                  Updating...
                </>
              ) : (
                "Update Product"
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
