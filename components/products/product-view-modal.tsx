"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Package, Tag, Layers, Hash, DollarSign, Building2 } from "lucide-react"
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

interface ProductViewModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export default function ProductViewModal({ product, isOpen, onClose }: ProductViewModalProps) {
  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto custom-scrollbar p-0 sm:p-6">
        {/* Mobile Header */}
        <DialogHeader className="sticky top-0 bg-white z-10 p-4 sm:p-0 border-b sm:border-b-0 rounded-t-lg">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold text-secondary">Product Details</span>
                <p className="text-sm text-muted-foreground">#{product.productId}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-0 space-y-6">
          {/* Product Image */}
          <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-muted border">
            <Image
              src={product.imagePath || "/placeholder.svg?height=400&width=600"}
              alt={product.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

            {/* Overlay badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="secondary" className="bg-white/90 text-secondary font-mono text-sm font-semibold">
                #{product.productId}
              </Badge>
            </div>

            <div className="absolute top-4 right-4">
              <Badge
                className={`${
                  product.quantity > 10 ? "status-sent" : product.quantity > 0 ? "status-pending" : "status-cancelled"
                } text-sm font-semibold`}
              >
                {product.quantity} in stock
              </Badge>
            </div>
          </div>

          {/* Product Header */}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-secondary mb-3">{product.name}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                {product.group}
              </Badge>
              <Badge variant="outline" className="border-secondary/30 text-secondary bg-secondary/5">
                {product.subGroup}
              </Badge>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="card-modern mobile-card bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Tag className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Product Group</p>
                    <p className="text-lg font-semibold text-secondary">{product.group}</p>
                  </div>
                </div>
              </div>

              <div className="card-modern mobile-card bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <Layers className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Sub-Group</p>
                    <p className="text-lg font-semibold text-secondary">{product.subGroup}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="card-modern mobile-card bg-success/5 border-success/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Available Stock</p>
                    <p className="text-lg font-semibold text-success">{product.quantity} units</p>
                  </div>
                </div>
              </div>

              <div className="card-modern mobile-card bg-primary/5 border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Unit Price</p>
                    <p className="text-lg font-semibold text-primary">PKR {product.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Value Card */}
          <div className="gradient-primary rounded-xl p-6 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-primary-foreground/80 text-sm mb-1">Total Inventory Value</p>
                <p className="text-3xl font-bold">PKR {(product.price * product.quantity).toLocaleString()}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Product Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-xl border">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Product ID</p>
              <p className="font-mono font-semibold text-secondary text-sm">{product.productId}</p>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-xl border">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Package className="h-5 w-5 text-success" />
              </div>
              <p className="text-xs text-muted-foreground">Stock Status</p>
              <p className="font-semibold text-success text-sm">
                {product.quantity > 10 ? "In Stock" : product.quantity > 0 ? "Low Stock" : "Out of Stock"}
              </p>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-xl border">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Tag className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-semibold text-secondary text-sm">{product.group}</p>
            </div>

            <div className="text-center p-4 bg-muted/30 rounded-xl border">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Value/Unit</p>
              <p className="font-semibold text-primary text-sm">PKR {product.price}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
