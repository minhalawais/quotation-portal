import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")
    const products = db.collection("products")

    // Validate quotation ID format
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid quotation ID" }, { status: 400 })
    }

    const quotation = await quotations.findOne({ _id: new ObjectId(params.id) })

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    // Get product details for each item
    const itemsWithDetails = await Promise.all(
      quotation.items.map(async (item: any) => {
        const product = await products.findOne({ _id: new ObjectId(item.productId) })
        return {
          ...item,
          productName: product?.name || "Unknown Product",
          productId: product?.productId || "N/A",
        }
      }),
    )

    // Generate PDF with enhanced styling
    const pdfBuffer = await generateEnhancedPDF(quotation, itemsWithDetails)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${quotation.customerName.replace(/\s+/g, "-")}-${params.id.slice(-6)}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Public PDF generation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function generateEnhancedPDF(quotation: any, items: any[]): Promise<Buffer> {
  try {
    const { jsPDF } = await import("jspdf")

    // Create new PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Define colors (RGB values for consistency)
    const colors = {
      primary: [37, 99, 235], // Blue
      primaryLight: [59, 130, 246], // Light Blue
      secondary: [107, 114, 128], // Gray
      text: [31, 41, 55], // Dark Gray
      lightGray: [249, 250, 251], // Very Light Gray
      white: [255, 255, 255], // White
      success: [34, 197, 94], // Green
      warning: [251, 191, 36], // Yellow
    }

    // Helper function to create gradient effect with multiple rectangles
    const createGradientEffect = (
      x: number,
      y: number,
      width: number,
      height: number,
      startColor: number[],
      endColor: number[],
    ) => {
      const steps = 20
      const stepHeight = height / steps

      for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1)
        const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio)
        const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio)
        const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio)

        doc.setFillColor(r, g, b)
        doc.rect(x, y + i * stepHeight, width, stepHeight + 0.1, "F")
      }
    }

    // Header with gradient background
    createGradientEffect(0, 0, 210, 80, colors.primary, colors.primaryLight)

    // Company name and details
    doc.setFont("helvetica", "bold")
    doc.setFontSize(28)
    doc.setTextColor(...colors.white)
    doc.text("INVENTORY PORTAL", 105, 25, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    doc.setTextColor(...colors.white)
    doc.text("Professional Inventory & Quotation Management", 105, 35, { align: "center" })

    // Quotation title with background
    doc.setFillColor(...colors.white)
    doc.roundedRect(70, 45, 70, 15, 3, 3, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(...colors.primary)
    doc.text("QUOTATION", 105, 55, { align: "center" })

    // Quotation number and status
    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.setTextColor(...colors.white)
    doc.text(`#${quotation._id.toString().slice(-8).toUpperCase()}`, 105, 68, { align: "center" })

    // Status badge
    const statusColor =
      quotation.status === "sent" ? colors.success : quotation.status === "pending" ? colors.warning : colors.secondary
    doc.setFillColor(...statusColor)
    doc.roundedRect(85, 72, 40, 6, 2, 2, "F")
    doc.setTextColor(...colors.white)
    doc.setFontSize(9)
    doc.text(`STATUS: ${quotation.status.toUpperCase()}`, 105, 76, { align: "center" })

    let yPos = 95

    // Customer Information Section with background
    doc.setFillColor(...colors.lightGray)
    doc.roundedRect(15, yPos - 5, 85, 35, 3, 3, "F")

    // Border for customer section
    doc.setDrawColor(...colors.primary)
    doc.setLineWidth(0.5)
    doc.roundedRect(15, yPos - 5, 85, 35, 3, 3, "S")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(...colors.primary)
    doc.text("BILL TO", 20, yPos + 2)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(...colors.text)
    yPos += 8
    doc.text(`Name: ${quotation.customerName}`, 20, yPos)
    yPos += 5
    doc.text(`Phone: ${quotation.customerPhone}`, 20, yPos)
    yPos += 5
    doc.text(`Address: ${quotation.customerAddress.substring(0, 35)}`, 20, yPos)
    if (quotation.customerAddress.length > 35) {
      yPos += 5
      doc.text(`${quotation.customerAddress.substring(35, 70)}`, 20, yPos)
    }

    // Quotation Details Section with background
    doc.setFillColor(...colors.lightGray)
    doc.roundedRect(110, 90, 85, 35, 3, 3, "F")

    // Border for quotation details section
    doc.setDrawColor(...colors.primary)
    doc.setLineWidth(0.5)
    doc.roundedRect(110, 90, 85, 35, 3, 3, "S")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(...colors.primary)
    doc.text("QUOTATION DETAILS", 115, 97)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(...colors.text)
    doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString()}`, 115, 105)
    doc.text(`Valid Until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 115, 110)
    doc.text(`Items: ${items.length}`, 115, 115)
    doc.text(`Total: PKR ${quotation.totalAmount.toLocaleString()}`, 115, 120)

    yPos = 140

    // Items Section Header with gradient
    createGradientEffect(15, yPos - 5, 180, 12, colors.primary, colors.primaryLight)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(...colors.white)
    doc.text("ITEMS & SERVICES", 105, yPos + 2, { align: "center" })

    yPos += 15

    // Table header with solid background
    doc.setFillColor(...colors.primary)
    doc.rect(15, yPos - 3, 180, 8, "F")

    // Table header borders
    doc.setDrawColor(...colors.white)
    doc.setLineWidth(0.3)
    doc.line(15, yPos - 3, 195, yPos - 3) // Top
    doc.line(15, yPos + 5, 195, yPos + 5) // Bottom
    doc.line(15, yPos - 3, 15, yPos + 5) // Left
    doc.line(195, yPos - 3, 195, yPos + 5) // Right

    // Column separators
    doc.line(50, yPos - 3, 50, yPos + 5) // After Product ID
    doc.line(120, yPos - 3, 120, yPos + 5) // After Description
    doc.line(140, yPos - 3, 140, yPos + 5) // After Qty
    doc.line(170, yPos - 3, 170, yPos + 5) // After Unit Price

    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(...colors.white)
    doc.text("PRODUCT ID", 17, yPos + 1)
    doc.text("DESCRIPTION", 52, yPos + 1)
    doc.text("QTY", 125, yPos + 1)
    doc.text("UNIT PRICE", 142, yPos + 1)
    doc.text("TOTAL", 172, yPos + 1)

    yPos += 10

    // Table rows with alternating backgrounds and borders
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...colors.text)

    items.forEach((item, index) => {
      const rowTotal = item.quantity * item.price

      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(...colors.lightGray)
        doc.rect(15, yPos - 2, 180, 6, "F")
      } else {
        doc.setFillColor(...colors.white)
        doc.rect(15, yPos - 2, 180, 6, "F")
      }

      // Row borders
      doc.setDrawColor(...colors.secondary)
      doc.setLineWidth(0.1)
      doc.rect(15, yPos - 2, 180, 6, "S")

      // Column separators
      doc.line(50, yPos - 2, 50, yPos + 4)
      doc.line(120, yPos - 2, 120, yPos + 4)
      doc.line(140, yPos - 2, 140, yPos + 4)
      doc.line(170, yPos - 2, 170, yPos + 4)

      // Cell content
      doc.setTextColor(...colors.text)
      doc.text(item.productId.toString().substring(0, 12), 17, yPos + 1)
      doc.text(item.productName.substring(0, 25), 52, yPos + 1)
      doc.text(item.quantity.toString(), 127, yPos + 1)
      doc.text(`PKR ${item.price.toLocaleString()}`, 142, yPos + 1)

      doc.setFont("helvetica", "bold")
      doc.setTextColor(...colors.primary)
      doc.text(`PKR ${rowTotal.toLocaleString()}`, 172, yPos + 1)
      doc.setFont("helvetica", "normal")

      yPos += 6

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
    })

    yPos += 10

    // Total Section with enhanced styling
    const totalSectionY = yPos

    // Total section background
    doc.setFillColor(...colors.lightGray)
    doc.roundedRect(120, totalSectionY, 75, 25, 3, 3, "F")

    // Total section border
    doc.setDrawColor(...colors.primary)
    doc.setLineWidth(0.5)
    doc.roundedRect(120, totalSectionY, 75, 25, 3, 3, "S")

    yPos += 5

    // Subtotal
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(...colors.text)
    doc.text("Subtotal:", 125, yPos)
    doc.text(`PKR ${quotation.totalAmount.toLocaleString()}`, 175, yPos)
    yPos += 5

    // Tax
    doc.text("Tax (0%):", 125, yPos)
    doc.text("PKR 0", 175, yPos)
    yPos += 5

    // Separator line
    doc.setDrawColor(...colors.primary)
    doc.setLineWidth(0.8)
    doc.line(125, yPos, 190, yPos)
    yPos += 5

    // Grand Total with highlight
    doc.setFillColor(...colors.primary)
    doc.roundedRect(123, yPos - 2, 70, 8, 2, 2, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...colors.white)
    doc.text("GRAND TOTAL:", 125, yPos + 2)
    doc.text(`PKR ${quotation.totalAmount.toLocaleString()}`, 175, yPos + 2)

    yPos += 20

    // Terms and Conditions with background
    if (yPos > 220) {
      doc.addPage()
      yPos = 20
    }

    doc.setFillColor(...colors.warning)
    doc.roundedRect(15, yPos - 3, 180, 8, 2, 2, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(...colors.white)
    doc.text("TERMS & CONDITIONS", 105, yPos + 1, { align: "center" })
    yPos += 12

    // Terms background
    doc.setFillColor(...colors.lightGray)
    doc.roundedRect(15, yPos - 3, 180, 35, 3, 3, "F")

    doc.setDrawColor(...colors.secondary)
    doc.setLineWidth(0.3)
    doc.roundedRect(15, yPos - 3, 180, 35, 3, 3, "S")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...colors.text)

    const terms = [
      "• This quotation is valid for 30 days from the date of issue.",
      "• Prices are subject to change without prior notice.",
      "• Payment terms: 50% advance, 50% on delivery.",
      "• Delivery time: 7-14 business days after order confirmation.",
      "• All prices are in Pakistani Rupees (PKR).",
      "• Returns are accepted within 7 days of delivery in original condition.",
    ]

    terms.forEach((term) => {
      doc.text(term, 20, yPos)
      yPos += 5
    })

    yPos += 10

    // Footer with gradient background
    createGradientEffect(0, yPos, 210, 25, colors.secondary, colors.primary)

    yPos += 8

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(...colors.white)
    doc.text("INVENTORY PORTAL", 105, yPos, { align: "center" })
    yPos += 6

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(...colors.white)
    doc.text("📧 info@inventoryportal.com  |  📱 +92-300-1234567  |  🌐 www.inventoryportal.com", 105, yPos, {
      align: "center",
    })
    yPos += 5
    doc.text("Thank you for your business!", 105, yPos, { align: "center" })

    // Convert to buffer
    const pdfArrayBuffer = doc.output("arraybuffer")
    return Buffer.from(pdfArrayBuffer)
  } catch (error) {
    console.error("Enhanced PDF generation failed:", error)
    throw new Error("PDF generation failed")
  }
}
