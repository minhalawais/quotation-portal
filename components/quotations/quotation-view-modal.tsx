"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, Send, Eye, Phone, MapPin, Calendar, FileText, MessageCircle, Share2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { formatPhoneForWhatsApp, generateWhatsAppMessage } from "@/lib/phone-utils"
import QuotationPreview from "./quotation-preview"

interface QuotationItem {
  productId: string
  quantity: number
  price: number
  productName?: string
}

interface Quotation {
  _id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  totalAmount: number
  status: string
  createdAt: string
  items: QuotationItem[]
}

interface QuotationViewModalProps {
  quotation: Quotation | null
  isOpen: boolean
  onClose: () => void
}

export default function QuotationViewModal({ quotation, isOpen, onClose }: QuotationViewModalProps) {
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  if (!quotation) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/pdf`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `quotation-${quotation._id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  const handleSend = async () => {
    try {
      await fetch(`/api/quotations/${quotation._id}/send`, {
        method: "POST",
      })
      // Handle success (show toast, refresh data, etc.)
    } catch (error) {
      console.error("Error sending quotation:", error)
    }
  }

  const handleWhatsAppShare = async () => {
    try {
      // Format phone number for WhatsApp
      const formattedPhone = formatPhoneForWhatsApp(quotation.customerPhone)

      // Generate quotation URL
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`

      // Generate WhatsApp message
      const message = generateWhatsAppMessage(quotation, quotationUrl)

      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`

      // Open WhatsApp
      window.open(whatsappUrl, "_blank")

      toast({
        title: "Success",
        description: "WhatsApp opened with quotation link",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open WhatsApp",
        variant: "destructive",
      })
    }
  }

  const handleCopyLink = async () => {
    try {
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
      await navigator.clipboard.writeText(quotationUrl)

      toast({
        title: "Success",
        description: "Quotation link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-lg sm:text-xl">Quotation Details</span>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowPreview(true)}
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none mobile-button"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                  <span className="sm:hidden">Preview</span>
                </Button>
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none mobile-button"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
                <Button
                  onClick={handleWhatsAppShare}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none mobile-button"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                  <span className="sm:hidden">WA</span>
                </Button>
                <Button
                  onClick={handleCopyLink}
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none mobile-button"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Copy Link</span>
                  <span className="sm:hidden">Link</span>
                </Button>
                {quotation.status === "pending" && (
                  <Button
                    onClick={handleSend}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none mobile-button"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                    <span className="sm:hidden">Send</span>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-2">
                    Quotation #{quotation._id.slice(-8).toUpperCase()}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(quotation.status)} px-3 py-1`}>
                      {quotation.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Created: {new Date(quotation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    PKR {quotation.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">C</span>
                  </div>
                  Customer Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-500 mt-1 shrink-0">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">{quotation.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{quotation.customerPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold text-gray-900 break-words">{quotation.customerAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Quotation Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Created Date</p>
                    <p className="font-semibold text-gray-900">{new Date(quotation.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Valid Until</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Items Count</p>
                    <p className="font-semibold text-gray-900">{quotation.items.length} items</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
                <h3 className="text-lg font-semibold text-white">Quotation Items</h3>
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 font-mono text-sm font-semibold text-blue-600">{item.productId}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.productName || "Product"}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600">
                          PKR {item.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                          PKR {(item.quantity * item.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden">
                {quotation.items.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 border-b last:border-b-0 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-sm font-semibold text-blue-600">{item.productId}</p>
                        <p className="text-sm text-gray-900 font-medium">{item.productName || "Product"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Unit Price:</span>
                        <span className="text-sm font-semibold text-blue-600">PKR {item.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Total:</span>
                        <span className="text-base font-bold text-blue-600">
                          PKR {(item.quantity * item.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6 border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Grand Total</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    PKR {quotation.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>Tax: PKR 0</p>
                  <p>Subtotal: PKR {quotation.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuotationPreview
        quotation={quotation}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onDownload={handleDownload}
        onSend={quotation.status === "pending" ? handleSend : undefined}
      />
    </>
  )
}
