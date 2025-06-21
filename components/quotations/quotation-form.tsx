"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Minus, FileText, Search } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Product {
  _id: string
  name: string
  price: number
  quantity: number
  productId: string
  group: string
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
    phone: "+92 ",
    address: "",
  })
  const [items, setItems] = useState<QuotationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState<number | null>(null)
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

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits except the + sign
    const cleaned = value.replace(/[^\d+]/g, "")

    // Ensure it starts with +92
    if (!cleaned.startsWith("+92")) {
      return "+92 "
    }

    // Format: +92 XXX XXXXXXX
    const digits = cleaned.slice(3) // Remove +92
    if (digits.length <= 3) {
      return `+92 ${digits}`
    } else if (digits.length <= 10) {
      return `+92 ${digits.slice(0, 3)} ${digits.slice(3)}`
    } else {
      return `+92 ${digits.slice(0, 3)} ${digits.slice(3, 10)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setCustomerData({ ...customerData, phone: formatted })
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

    // Validate phone number
    const phoneRegex = /^\+92 \d{3} \d{7}$/
    if (!phoneRegex.test(customerData.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter phone number in format: +92 XXX XXXXXXX",
        variant: "destructive",
      })
      return
    }

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

  const ProductSearchCombobox = ({
    index,
    value,
    onSelect,
  }: { index: number; value: string; onSelect: (value: string) => void }) => {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredProducts = useMemo(() => {
      if (!searchTerm) return products.slice(0, 10) // Show first 10 products by default

      return products
        .filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.group.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, 20) // Limit to 20 results for performance
    }, [searchTerm, products])

    const selectedProduct = products.find((p) => p._id === value)

    return (
      <Popover open={searchOpen === index} onOpenChange={(open) => setSearchOpen(open ? index : null)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={searchOpen === index}
            className="w-full justify-between text-left font-normal"
          >
            {selectedProduct ? (
              <span className="truncate">
                {selectedProduct.name} (₹{selectedProduct.price})
              </span>
            ) : (
              <span className="text-muted-foreground">Select product...</span>
            )}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search products..." value={searchTerm} onValueChange={setSearchTerm} />
            <CommandList>
              <CommandEmpty>No products found.</CommandEmpty>
              <CommandGroup>
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product._id}
                    value={product._id}
                    onSelect={() => {
                      onSelect(product._id)
                      setSearchOpen(null)
                      setSearchTerm("")
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate">{product.name}</span>
                        <span className="text-sm text-blue-600 font-semibold">₹{product.price}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>ID: {product.productId}</span>
                        <span>Stock: {product.quantity}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6 px-4 lg:px-0">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg lg:text-xl">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium">
                Customer Name
              </Label>
              <Input
                id="customerName"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                required
                className="h-11"
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="customerPhone"
                value={customerData.phone}
                onChange={handlePhoneChange}
                required
                className="h-11"
                placeholder="+92 XXX XXXXXXX"
                maxLength={15}
              />
              <p className="text-xs text-gray-500">Format: +92 XXX XXXXXXX</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress" className="text-sm font-medium">
                Address
              </Label>
              <Input
                id="customerAddress"
                value={customerData.address}
                onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                required
                className="h-11"
                placeholder="Enter customer address"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg lg:text-xl">Products</CardTitle>
            <Button onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Item #{index + 1}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Product</Label>
                  <ProductSearchCombobox
                    index={index}
                    value={item.productId}
                    onSelect={(value) => updateItem(index, "productId", value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value))}
                      className="h-10"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, "price", Number.parseFloat(e.target.value))}
                      className="h-10"
                    />
                  </div>
                </div>

                {item.productId && item.quantity > 0 && item.price > 0 && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-900">Item Total:</span>
                      <span className="text-lg font-bold text-blue-600">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm">No items added. Click "Add Item" to start building your quotation.</p>
            </div>
          )}

          {items.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                <span className="text-2xl font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 pb-6">
        <Button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 h-11 flex-1 sm:flex-none"
          disabled={loading || items.length === 0}
        >
          <FileText className="mr-2 h-4 w-4" />
          {loading ? "Creating..." : "Create Quotation"}
        </Button>

        <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 flex-1 sm:flex-none">
          Cancel
        </Button>
      </div>
    </div>
  )
}
