"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Send, Eye, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { logActivity } from "@/lib/logger"
import QuotationViewModal from "./quotation-view-modal"
import QuotationPreview from "./quotation-preview"

interface Quotation {
  _id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  totalAmount: number
  status: string
  createdAt: string
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
}

interface QuotationListProps {
  userRole: string
}

export default function QuotationList({ userRole }: QuotationListProps) {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()

  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    try {
      const response = await fetch("/api/quotations")
      if (response.ok) {
        const data = await response.json()
        setQuotations(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch quotations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setViewModalOpen(true)

    // Log view activity
    if (session) {
      await logActivity({
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action: "VIEW",
        resource: "Quotation",
        resourceId: quotation._id,
        details: `Viewed quotation for ${quotation.customerName}`,
        status: "success",
      })
    }
  }

  const handlePreview = async (quotation: Quotation) => {
    setSelectedQuotation(quotation)
    setPreviewModalOpen(true)

    // Log preview activity
    if (session) {
      await logActivity({
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action: "VIEW",
        resource: "Quotation",
        resourceId: quotation._id,
        details: `Previewed quotation for ${quotation.customerName}`,
        status: "success",
      })
    }
  }

  const handleDownload = async (quotation: Quotation) => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `quotation-${quotation.customerName.replace(/\s+/g, "-")}-${quotation._id.slice(-6)}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)

        // Log download activity
        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "DOWNLOAD",
            resource: "Quotation",
            resourceId: quotation._id,
            details: `Downloaded PDF for quotation: ${quotation.customerName}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "Quotation PDF downloaded successfully",
        })
      } else {
        throw new Error("Failed to download PDF")
      }
    } catch (error) {
      // Log error activity
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "DOWNLOAD",
          resource: "Quotation",
          resourceId: quotation._id,
          details: `Failed to download PDF for quotation: ${quotation.customerName}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      })
    }
  }

  const handleWhatsAppShare = async (quotation: Quotation) => {
    try {
      const message = `Hello ${quotation.customerName}! Your quotation is ready. Total Amount: PKR ${quotation.totalAmount.toLocaleString()}. Please find the details attached.`
      const whatsappUrl = `https://wa.me/${quotation.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`

      window.open(whatsappUrl, "_blank")

      // Log share activity
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "SHARE",
          resource: "Quotation",
          resourceId: quotation._id,
          details: `Shared quotation via WhatsApp to ${quotation.customerName}`,
          status: "success",
        })
      }

      toast({
        title: "Success",
        description: "WhatsApp opened with quotation details",
      })
    } catch (error) {
      // Log error activity
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "SHARE",
          resource: "Quotation",
          resourceId: quotation._id,
          details: `Failed to share quotation via WhatsApp to ${quotation.customerName}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to open WhatsApp",
        variant: "destructive",
      })
    }
  }

  const handleSendQuotation = async (quotation: Quotation) => {
    try {
      const response = await fetch(`/api/quotations/${quotation._id}/send`, {
        method: "POST",
      })

      if (response.ok) {
        // Update quotation status
        setQuotations(quotations.map((q) => (q._id === quotation._id ? { ...q, status: "sent" } : q)))

        // Log send activity
        if (session) {
          await logActivity({
            userId: session.user.id,
            userName: session.user.name,
            userRole: session.user.role,
            action: "SEND",
            resource: "Quotation",
            resourceId: quotation._id,
            details: `Sent quotation to ${quotation.customerName}`,
            status: "success",
          })
        }

        toast({
          title: "Success",
          description: "Quotation sent successfully",
        })
      } else {
        throw new Error("Failed to send quotation")
      }
    } catch (error) {
      // Log error activity
      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "SEND",
          resource: "Quotation",
          resourceId: quotation._id,
          details: `Failed to send quotation to ${quotation.customerName}`,
          status: "error",
        })
      }

      toast({
        title: "Error",
        description: "Failed to send quotation",
        variant: "destructive",
      })
    }
  }

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {quotations.map((quotation) => (
          <Card key={quotation._id} className="card-hover bg-white shadow-sm border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{quotation.customerName}</CardTitle>
                <Badge className={getStatusColor(quotation.status)}>{quotation.status}</Badge>
              </div>
              <p className="text-sm text-gray-600">{quotation.customerPhone}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-lg font-bold text-blue-600">PKR {quotation.totalAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Items:</span>
                  <span className="text-sm font-medium">{quotation.items.length} product(s)</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm">{new Date(quotation.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(quotation)}
                  className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(quotation)}
                  className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Preview
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(quotation)}
                  className="hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                >
                  <Download className="mr-1 h-4 w-4" />
                  PDF
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleWhatsAppShare(quotation)}
                  className="hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                >
                  <MessageCircle className="mr-1 h-4 w-4" />
                  WhatsApp
                </Button>

                {quotation.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleSendQuotation(quotation)}
                    className="bg-blue-600 hover:bg-blue-700 col-span-2"
                  >
                    <Send className="mr-1 h-4 w-4" />
                    Send Quotation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {quotations.length === 0 && (
          <div className="col-span-full">
            <Card className="p-8 lg:p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-2 border-gray-300">
              <FileText className="mx-auto h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mb-4" />
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No quotations found</h3>
              <p className="text-gray-600 mb-4 lg:mb-6">Create your first quotation to get started.</p>
              <Button
                onClick={() => (window.location.href = "/quotations/create")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Create Your First Quotation
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Quotation View Modal */}
      <QuotationViewModal
        quotation={selectedQuotation}
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />

      {/* Quotation Preview Modal */}
      <QuotationPreview
        quotation={selectedQuotation}
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onDownload={() => selectedQuotation && handleDownload(selectedQuotation)}
        onSend={() => selectedQuotation && handleSendQuotation(selectedQuotation)}
      />
    </>
  )
}
