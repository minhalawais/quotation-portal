"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Phone, MapPin, Calendar, Clock, FileText, ArrowLeft, Building2, Mail, Globe } from "lucide-react"
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
        return "status-sent"
      case "pending":
        return "status-pending"
      case "cancelled":
        return "status-cancelled"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
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
    <div className="min-h-screen bg-gradient-to-br from-muted to-muted/50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto mobile-container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()} className="mobile-button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-secondary">Inventory Portal</h1>
                  <p className="text-sm text-muted-foreground">Professional Quotation</p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary mobile-button w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading ? "Downloading..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto mobile-container py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border">
          {/* Quotation Header */}
          <div className="gradient-primary text-white p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">Inventory Portal</h1>
              <p className="text-primary-foreground/80">Professional Inventory & Quotation Management</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-white">QUOTATION</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="bg-white px-4 py-2 rounded-full">
                  <span className="text-sm font-mono font-bold text-secondary">
                    #{quotation._id.slice(-8).toUpperCase()}
                  </span>
                </div>
                <Badge className={`${getStatusColor(quotation.status)} px-4 py-2 text-sm font-semibold`}>
                  {quotation.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Information Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Customer Information */}
              <div className="bg-muted/30 rounded-xl p-6 border">
                <h3 className="text-xl font-bold text-secondary mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="text-primary font-bold">B</span>
                  </div>
                  Bill To
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                      <p className="text-lg font-semibold text-secondary">{quotation.customerName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                      <Phone className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p className="text-lg font-semibold text-secondary">{quotation.customerPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                      <MapPin className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="text-lg font-semibold text-secondary break-words">{quotation.customerAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quotation Details */}
              <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                <h3 className="text-xl font-bold text-secondary mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  Quotation Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                      <p className="text-lg font-semibold text-secondary">
                        {new Date(quotation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
                      <p className="text-lg font-semibold text-secondary">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          quotation.status === "sent"
                            ? "bg-success"
                            : quotation.status === "pending"
                              ? "bg-yellow-500"
                              : "bg-destructive"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <p className="text-lg font-semibold text-secondary uppercase">{quotation.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-8">
              <div className="gradient-primary rounded-t-xl p-6 text-center">
                <h3 className="text-xl font-bold text-white">Items & Services</h3>
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto bg-white border-x border-b rounded-b-xl">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Description</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, index) => (
                      <tr key={index}>
                        <td className="font-mono text-sm font-bold text-primary">{item.productId}</td>
                        <td className="font-medium">{item.productName || "Product"}</td>
                        <td className="text-center font-semibold">{item.quantity}</td>
                        <td className="text-right font-semibold text-primary">PKR {item.price.toLocaleString()}</td>
                        <td className="text-right font-bold text-primary">
                          PKR {(item.quantity * item.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden bg-white border-x border-b rounded-b-xl divide-y">
                {quotation.items.map((item, index) => (
                  <div key={index} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="font-mono text-sm font-bold text-primary mb-1">{item.productId}</p>
                        <p className="font-semibold text-secondary">{item.productName || "Product"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <p className="font-bold text-lg">{item.quantity}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Unit Price</p>
                        <p className="font-semibold text-primary">PKR {item.price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-bold text-lg text-primary">
                          PKR {(item.quantity * item.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Section */}
            <div className="mb-8">
              <div className="flex justify-end">
                <div className="w-full sm:w-96 gradient-primary rounded-xl p-6 text-white">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-semibold">PKR {quotation.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Tax (0%):</span>
                      <span className="font-semibold">PKR 0</span>
                    </div>
                    <div className="border-t-2 border-white/20 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">Grand Total:</span>
                        <span className="text-2xl font-bold">PKR {quotation.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-8">
              <div className="alert-warning rounded-xl">
                <h4 className="font-bold text-yellow-800 mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">!</span>
                  </div>
                  Terms & Conditions
                </h4>
                <div className="text-sm text-yellow-800 space-y-3 ml-11">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold mt-1">•</span>
                    <p>This quotation is valid for 30 days from the date of issue.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold mt-1">•</span>
                    <p>Prices are subject to change without prior notice.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold mt-1">•</span>
                    <p>Payment terms: 50% advance, 50% on delivery.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold mt-1">•</span>
                    <p>Delivery time: 7-14 business days after order confirmation.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold mt-1">•</span>
                    <p>All prices are in Pakistani Rupees (PKR).</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold mt-1">•</span>
                    <p>Returns are accepted within 7 days of delivery in original condition.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-8 border">
              <div className="mb-6">
                <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">IP</span>
                </div>
                <h4 className="font-bold text-secondary text-xl mb-2">Inventory Portal</h4>
                <p className="text-muted-foreground">Professional Business Solutions</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>info@inventoryportal.com</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+92-300-1234567</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>www.inventoryportal.com</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-primary font-semibold">Thank you for your business!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
