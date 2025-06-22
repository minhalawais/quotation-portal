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
import { Upload, Loader2, ArrowLeft, Tag, Hash, DollarSign, ImageIcon, Edit } from "lucide-react"
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
      <div className="mobile-container">
        <Card className="card-modern">
          <CardContent className="mobile-card">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mobile-container space-y-6">
      <Card className="card-modern">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-secondary">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mobile-button hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold">Edit Product</span>
              <p className="text-sm text-muted-foreground font-normal">Update product information and details</p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="mobile-spacing">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Image Preview */}
            {currentImagePath && (
              <div className="bg-muted/30 rounded-xl p-6 border">
                <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-gray-600" />
                  </div>
                  Current Product Image
                </h3>
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200">
                  <Image
                    src={currentImagePath || "/placeholder.svg"}
                    alt="Current product"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Product Categories */}
            <div className="bg-muted/30 rounded-xl p-6 border">
              <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Tag className="h-4 w-4 text-secondary" />
                </div>
                Product Categories
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="group" className="text-sm font-medium text-secondary">
                    Product Group
                  </Label>
                  <Select value={formData.group} onValueChange={(value) => setFormData({ ...formData, group: value })}>
                    <SelectTrigger className="input-modern mobile-input">
                      <SelectValue placeholder="Select product group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hosiery">Hosiery</SelectItem>
                      <SelectItem value="garments">Garments</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subGroup" className="text-sm font-medium text-secondary">
                    Sub-Group
                  </Label>
                  <Input
                    id="subGroup"
                    value={formData.subGroup}
                    onChange={(e) => setFormData({ ...formData, subGroup: e.target.value })}
                    required
                    className="input-modern mobile-input"
                    placeholder="Enter sub-group"
                  />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                Product Details
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productId" className="text-sm font-medium text-secondary">
                      Product ID
                    </Label>
                    <Input
                      id="productId"
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      required
                      className="input-modern mobile-input font-mono"
                      placeholder="Enter unique product ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-medium text-secondary">
                      Current Stock Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      className="input-modern mobile-input"
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-secondary">
                    Product Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input-modern mobile-input"
                    placeholder="Enter descriptive product name"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-success/5 rounded-xl p-6 border border-success/20">
              <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-success" />
                </div>
                Pricing Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium text-secondary">
                  Unit Price (PKR)
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="input-modern mobile-input"
                  placeholder="Enter price per unit"
                />
              </div>
            </div>

            {/* Update Product Image */}
            <div className="bg-muted/30 rounded-xl p-6 border">
              <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-gray-600" />
                </div>
                Update Product Image
              </h3>

              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-medium text-secondary">
                  Upload New Image (Optional)
                </Label>
                <div className="flex items-center space-x-3">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="flex-1 input-modern mobile-input"
                  />
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Upload className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep the current image. Upload a new image to replace it.
                </p>
              </div>
            </div>

            {/* Summary Card */}
            {formData.name && formData.price && formData.quantity && (
              <div className="gradient-primary rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Updated Product Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-primary-foreground/80">Product Name</p>
                    <p className="font-semibold">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-primary-foreground/80">Current Stock</p>
                    <p className="font-semibold">{formData.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-primary-foreground/80">Total Value</p>
                    <p className="font-semibold">
                      PKR{" "}
                      {(
                        Number.parseFloat(formData.price || "0") * Number.parseInt(formData.quantity || "0")
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" className="btn-primary mobile-button flex-1 sm:flex-none" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Product...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Product
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="mobile-button flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
