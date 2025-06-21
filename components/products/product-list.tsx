"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye, Package } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { logActivity } from "@/lib/logger"
import ProductViewModal from "./product-view-modal"

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

interface ProductListProps {
  userRole: string
}

export default function ProductList({ userRole }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (product: Product) => {
    setSelectedProduct(product)
    setViewModalOpen(true)

    // Log view activity
    if (session) {
      await logActivity({
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action: "VIEW",
        resource: "Product",
        resourceId: product._id,
        details: `Viewed product: ${product.name}`,
        status: "success",
      })
    }
  }

  const handleEdit = (productId: string) => {
    router.push(`/products/edit/${productId}`)
  }

  const deleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return

    try {
      const response = await fetch(`/api/products/${product._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProducts(products.filter((p) => p._id !== product._id))

        // Log delete activity
        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "DELETE",
            resource: "Product",
            resourceId: product._id,
            details: `Deleted product: ${product.name}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "Product deleted successfully",
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
          resource: "Product",
          resourceId: product._id,
          details: `Failed to delete product: ${product.name}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 lg:px-0">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 lg:px-0">
        {products.map((product) => (
          <Card key={product._id} className="card-hover overflow-hidden bg-white shadow-sm border-0 group">
            <div className="relative h-48 overflow-hidden">
              <Image
                src={product.imagePath || "/placeholder.svg?height=200&width=300"}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Stock badge */}
              <div className="absolute top-2 right-2">
                <Badge
                  variant={product.quantity > 10 ? "default" : "destructive"}
                  className={`${product.quantity > 10 ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white shadow-lg text-xs`}
                >
                  {product.quantity}
                </Badge>
              </div>

              {/* Product ID badge */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-white/90 text-gray-700 font-mono text-xs">
                  #{product.productId}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {product.group} • {product.subGroup}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">PKR {product.price.toLocaleString()}</span>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(product)}
                    className="w-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200 h-9"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>

                  {userRole === "manager" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product._id)}
                        className="flex-1 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all duration-200 h-9"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteProduct(product)}
                        className="flex-1 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200 h-9"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {products.length === 0 && (
          <div className="col-span-full">
            <Card className="p-8 sm:p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-2 border-gray-300 mx-4 lg:mx-0">
              <Package className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Get started by adding your first product to the inventory.
              </p>
              {userRole === "manager" && (
                <Button
                  onClick={() => router.push("/products/add")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Add Your First Product
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Product View Modal */}
      <ProductViewModal product={selectedProduct} isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} />
    </>
  )
}
