"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Download,
  Send,
  Eye,
  MessageCircle,
  Phone,
  MapPin,
  Share2,
  Calendar,
  DollarSign,
  Package,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { logActivity } from "@/lib/logger"
import { formatPhoneForWhatsApp, generateWhatsAppMessage } from "@/lib/phone-utils"
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
      const formattedPhone = formatPhoneForWhatsApp(quotation.customerPhone)
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
      const message = generateWhatsAppMessage(quotation, quotationUrl)
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`

      window.open(whatsappUrl, "_blank")

      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "SHARE",
          resource: "Quotation",
          resourceId: quotation._id,
          details: `Shared quotation via WhatsApp to ${quotation.customerName} (${formattedPhone})`,
          status: "success",
        })
      }

      toast({
        title: "Success",
        description: "WhatsApp opened with quotation link",
      })
    } catch (error) {
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

  const handleCopyLink = async (quotation: Quotation) => {
    try {
      const quotationUrl = `${window.location.origin}/quotations/${quotation._id}`
      await navigator.clipboard.writeText(quotationUrl)

      toast({
        title: "Success",
        description: "Quotation link copied to clipboard",
      })

      if (session) {
        await logActivity({
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: "COPY_LINK",
          resource: "Quotation",
          resourceId: quotation._id,
          details: `Copied quotation link for ${quotation.customerName}`,
          status: "success",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
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
        setQuotations(quotations.map((q) => (q._id === quotation._id ? { ...q, status: "sent" } : q)))

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
        return "status-sent"
      case "pending":
        return "status-pending"
      case "cancelled":
        return "status-cancelled"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="mobile-grid">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="card-modern animate-pulse">
            <CardContent className="mobile-card">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="mobile-grid">
        {quotations.map((quotation) => (
          <Card key={quotation._id} className="card-modern group hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-secondary truncate mb-2">
                    {quotation.customerName}
                  </CardTitle>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="truncate">{quotation.customerPhone}</span>
                    </div>

                    <div className="flex items-start text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2 text-xs leading-relaxed">{quotation.customerAddress}</span>
                    </div>
                  </div>
                </div>

                <Badge className={`${getStatusColor(quotation.status)} font-medium`}>{quotation.status}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Amount and Stats */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-secondary">Total Amount</span>
                  </div>
                  <span className="text-xl font-bold text-primary">PKR {quotation.totalAmount.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>Items: {quotation.items.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(quotation.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(quotation)}
                    className="mobile-button hover:bg-primary/5 hover:border-primary/30 hover:text-primary"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(quotation)}
                    className="mobile-button hover:bg-secondary/5 hover:border-secondary/30 hover:text-secondary"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(quotation)}
                    className="mobile-button hover:bg-success/5 hover:border-success/30 hover:text-success"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleWhatsAppShare(quotation)}
                    className="mobile-button hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                  >
                    <MessageCircle className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                    <span className="sm:hidden">WA</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyLink(quotation)}
                    className="mobile-button hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  >
                    <Share2 className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Link</span>
                    <span className="sm:hidden">Link</span>
                  </Button>
                </div>

                {quotation.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleSendQuotation(quotation)}
                    className="btn-success w-full mobile-button"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Quotation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {quotations.length === 0 && (
          <div className="col-span-full">
            <Card className="card-modern text-center py-12 border-2 border-dashed border-gray-300">
              <CardContent className="mobile-card">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-secondary mb-3">No quotations found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first quotation to get started with managing your business quotes and proposals.
                </p>
                <Button
                  onClick={() => (window.location.href = "/quotations/create")}
                  className="btn-primary mobile-button"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create Your First Quotation
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <QuotationViewModal
        quotation={selectedQuotation}
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />

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
