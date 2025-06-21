"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Phone, MapPin, Calendar, Clock, FileText, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

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

interface PublicQuotationViewProps {
  quotation: Quotation
}

export default function PublicQuotationView({ quotation }: PublicQuotationViewProps) {
  const [downloading, setDownloading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
    setDownloading(true)
    try {
      // Use the public PDF endpoint that doesn't require authentication
      const response = await fetch(`/api/public/quotations/${quotation._id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `quotation-${quotation.customerName.replace(/\s+/g, "-")}-${quotation._id.slice(-6)}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Quotation PDF downloaded successfully",
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to download PDF")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download PDF",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Inventory Portal</h1>
                <p className="text-sm text-gray-600">Quotation View</p>
              </div>
            </div>
            <Button onClick={handleDownload} disabled={downloading} className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Downloading..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Quotation Header */}
          <div className="text-center mb-6 sm:mb-8 border-b-2 border-blue-600 pb-4 sm:pb-6 px-4 sm:px-8 pt-4 sm:pt-8">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">Inventory Portal</h1>
              <p className="text-sm sm:text-base text-gray-600 mb-4">Professional Inventory & Quotation Management</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-3">QUOTATION</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="bg-white px-4 py-2 rounded-full shadow-sm">
                  <span className="text-sm font-mono font-semibold text-gray-700">
                    #{quotation._id.slice(-8).toUpperCase()}
                  </span>
                </div>
                <Badge className={`${getStatusColor(quotation.status)} px-3 py-1 text-sm font-medium`}>
                  {quotation.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Information Section */}
          <div className="px-4 sm:px-8 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">B</span>
                  </div>
                  Bill To:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-500 mt-0.5 shrink-0">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700 text-sm">Name:</span>
                      <p className="text-gray-900 font-medium">{quotation.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-700 text-sm">Phone:</span>
                      <p className="text-gray-900 font-medium">{quotation.customerPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-700 text-sm">Address:</span>
                      <p className="text-gray-900 font-medium break-words">{quotation.customerAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quotation Details */}
              <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  Quotation Details:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-700 text-sm">Date:</span>
                      <p className="text-gray-900 font-medium">{new Date(quotation.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-700 text-sm">Valid Until:</span>
                      <p className="text-gray-900 font-medium">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          quotation.status === "sent"
                            ? "bg-green-500"
                            : quotation.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700 text-sm">Status:</span>
                      <p className="text-gray-900 font-medium uppercase">{quotation.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="px-4 sm:px-8 mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-lg p-4 text-center">
              <h3 className="text-lg sm:text-xl font-bold text-white">Items & Services</h3>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto bg-white border border-t-0 rounded-b-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={index} className={`border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
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
            <div className="sm:hidden bg-white border border-t-0 rounded-b-lg">
              {quotation.items.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 border-b last:border-b-0 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono text-sm font-semibold text-blue-600">{item.productId}</p>
                      <p className="text-sm text-gray-900 font-medium">{item.productName || "Product"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Unit Price:</span>
                    <span className="text-sm font-semibold text-blue-600">PKR {item.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Total:</span>
                    <span className="text-base font-bold text-blue-600">
                      PKR {(item.quantity * item.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Section */}
          <div className="px-4 sm:px-8 mb-6 sm:mb-8">
            <div className="flex justify-end">
              <div className="w-full sm:w-80 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6 border border-blue-200">
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="font-semibold text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-blue-600">PKR {quotation.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-semibold text-gray-700">Tax (0%):</span>
                    <span className="font-semibold text-blue-600">PKR 0</span>
                  </div>
                  <div className="border-t-2 border-blue-600 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg sm:text-xl font-bold text-blue-900">Grand Total:</span>
                      <span className="text-xl sm:text-2xl font-bold text-blue-600">
                        PKR {quotation.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="px-4 sm:px-8 mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg p-4 sm:p-6">
              <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 text-xs">!</span>
                </div>
                Terms & Conditions:
              </h4>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-1">•</span>
                  <p>This quotation is valid for 30 days from the date of issue.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-1">•</span>
                  <p>Prices are subject to change without prior notice.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-1">•</span>
                  <p>Payment terms: 50% advance, 50% on delivery.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-1">•</span>
                  <p>Delivery time: 7-14 business days after order confirmation.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-1">•</span>
                  <p>All prices are in Pakistani Rupees (PKR).</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-1">•</span>
                  <p>Returns are accepted within 7 days of delivery in original condition.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-8 pb-4 sm:pb-8">
            <div className="text-center border-t-2 border-gray-200 pt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 sm:p-6">
              <div className="mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">IP</span>
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Inventory Portal</h4>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="flex items-center justify-center gap-2">
                  <span>📧</span> info@inventoryportal.com
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span>📱</span> +92-300-1234567
                </p>
                <p className="flex items-center justify-center gap-2">
                  <span>🌐</span> www.inventoryportal.com
                </p>
                <p className="italic mt-3 text-blue-600 font-medium">Thank you for your business!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
