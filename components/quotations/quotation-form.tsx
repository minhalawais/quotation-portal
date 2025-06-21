"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Minus, FileText } from "lucide-react"

interface Product {
  _id: string
  name: string
  price: number
  quantity: number
  productId: string
}

interface QuotationItem {
  productId: string
  quantity: number
  price: number
}

interface QuotationFormProps {
  userId: string
}

export default function QuotationForm({ userId }: QuotationFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    address: "",
  })
  const [items, setItems] = useState<QuotationItem[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
      console.error("Failed to fetch products:", error)
    }
  }

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    if (field === "productId") {
      const product = products.find((p) => p._id === value)
      if (product) {
        updatedItems[index].price = product.price
      }
    }

    setItems(updatedItems)
  }

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.quantity * item.price, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          riderId: userId,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          customerAddress: customerData.address,
          items,
          totalAmount: calculateTotal(),
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Quotation created successfully",
        })
        router.push("/quotations")
      } else {
        throw new Error("Failed to create quotation")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input
                id="customerPhone"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerAddress">Address</Label>
            <Input
              id="customerAddress"
              value={customerData.address}
              onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Products</CardTitle>
            <Button onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
              <div className="md:col-span-2">
                <Label>Product</Label>
                <Select value={item.productId} onValueChange={(value) => updateItem(index, "productId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name} (₹{product.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItem(index, "price", Number.parseFloat(e.target.value))}
                />
              </div>

              <div className="flex items-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items added. Click "Add Item" to start building your quotation.
            </div>
          )}

          {items.length > 0 && (
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-lg font-semibold">Total: ₹{calculateTotal().toFixed(2)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={loading || items.length === 0}
        >
          <FileText className="mr-2 h-4 w-4" />
          Create Quotation
        </Button>

        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
