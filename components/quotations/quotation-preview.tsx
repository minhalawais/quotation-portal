"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, Send } from "lucide-react"

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

interface QuotationPreviewProps {
  quotation: Quotation | null
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
  onSend?: () => void
}

export default function QuotationPreview({ quotation, isOpen, onClose, onDownload, onSend }: QuotationPreviewProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Quotation Preview</span>
            <div className="flex items-center space-x-2">
              <Button onClick={onDownload} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              {onSend && quotation.status === "pending" && (
                <Button onClick={onSend} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* PDF Preview */}
        <div className="bg-white border rounded-lg p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-blue-600 pb-6">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Inventory Portal</h1>
            <p className="text-gray-600 mb-4">Professional Inventory & Quotation Management</p>
            <h2 className="text-2xl font-bold text-blue-900 mb-2">QUOTATION</h2>
            <div className="flex items-center justify-center space-x-4">
              <span className="bg-gray-100 px-4 py-2 rounded-full text-sm font-mono">
                #{quotation._id.slice(-8).toUpperCase()}
              </span>
              <Badge className={getStatusColor(quotation.status)}>{quotation.status}</Badge>
            </div>
          </div>

          {/* Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-blue-600 mb-4 border-b border-gray-200 pb-2">Bill To:</h3>
              <div className="space-y-2">
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-20">Name:</span>
                  <span className="text-gray-600">{quotation.customerName}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-20">Phone:</span>
                  <span className="text-gray-600">{quotation.customerPhone}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-20">Address:</span>
                  <span className="text-gray-600">{quotation.customerAddress}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-blue-600 mb-4 border-b border-gray-200 pb-2">Quotation Details:</h3>
              <div className="space-y-2">
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-24">Date:</span>
                  <span className="text-gray-600">{new Date(quotation.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-24">Valid Until:</span>
                  <span className="text-gray-600">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-24">Status:</span>
                  <span className="text-gray-600 uppercase">{quotation.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4 text-center">Items & Services</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left">Product ID</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Description</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Quantity</th>
                    <th className="border border-gray-300 px-4 py-3 text-right">Unit Price</th>
                    <th className="border border-gray-300 px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="border border-gray-300 px-4 py-3 font-semibold">{item.productId}</td>
                      <td className="border border-gray-300 px-4 py-3">{item.productName || "Product"}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-blue-600">
                        PKR {item.price.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-blue-600">
                        PKR {(item.quantity * item.price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Section */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between py-2">
                <span className="font-semibold text-gray-700">Subtotal:</span>
                <span className="font-semibold text-blue-600">PKR {quotation.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold text-gray-700">Tax (0%):</span>
                <span className="font-semibold text-blue-600">PKR 0</span>
              </div>
              <div className="border-t-2 border-blue-600 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-xl font-bold text-blue-900">Grand Total:</span>
                  <span className="text-2xl font-bold text-blue-600">PKR {quotation.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-600 mb-8">
            <h4 className="font-bold text-blue-900 mb-3">Terms & Conditions:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• This quotation is valid for 30 days from the date of issue.</p>
              <p>• Prices are subject to change without prior notice.</p>
              <p>• Payment terms: 50% advance, 50% on delivery.</p>
              <p>• Delivery time: 7-14 business days after order confirmation.</p>
              <p>• All prices are in Pakistani Rupees (PKR).</p>
              <p>• Returns are accepted within 7 days of delivery in original condition.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t-2 border-gray-200 pt-6">
            <div className="text-sm text-gray-600">
              <p className="font-bold text-gray-900">Inventory Portal</p>
              <p>Email: info@inventoryportal.com | Phone: +92-300-1234567</p>
              <p>Website: www.inventoryportal.com</p>
              <p className="italic mt-2">Thank you for your business!</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
