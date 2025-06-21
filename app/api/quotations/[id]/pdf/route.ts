import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")
    const products = db.collection("products")

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

    // Generate HTML for PDF
    const htmlContent = generateQuotationHTML(quotation, itemsWithDetails)

    // Convert HTML to PDF using Puppeteer-like approach
    const pdfBuffer = await generatePDFFromHTML(htmlContent)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${quotation.customerName.replace(/\s+/g, "-")}-${params.id.slice(-6)}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

function generateQuotationHTML(quotation: any, items: any[]) {
  const currentDate = new Date().toLocaleDateString()
  const quotationDate = new Date(quotation.createdAt).toLocaleDateString()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation - ${quotation.customerName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .company-name {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .company-tagline {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
        }
        
        .quotation-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 10px;
        }
        
        .quotation-number {
            font-size: 16px;
            color: #666;
            background: #f3f4f6;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
        }
        
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            gap: 40px;
        }
        
        .info-block {
            flex: 1;
        }
        
        .info-title {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
        }
        
        .info-item {
            margin-bottom: 8px;
            display: flex;
        }
        
        .info-label {
            font-weight: bold;
            color: #374151;
            min-width: 80px;
        }
        
        .info-value {
            color: #6b7280;
        }
        
        .items-section {
            margin-bottom: 40px;
        }
        
        .items-title {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .items-table th {
            background: linear-gradient(135deg, #2563eb, #1e3a8a);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
        }
        
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }
        
        .items-table tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        .items-table tr:hover {
            background-color: #f3f4f6;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .total-section {
            margin-top: 30px;
            text-align: right;
        }
        
        .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .total-label {
            font-weight: bold;
            color: #374151;
            min-width: 150px;
            text-align: right;
            margin-right: 20px;
        }
        
        .total-value {
            color: #6b7280;
            min-width: 120px;
            text-align: right;
        }
        
        .grand-total {
            border-top: 2px solid #2563eb;
            padding-top: 15px;
            margin-top: 15px;
        }
        
        .grand-total .total-label {
            font-size: 20px;
            color: #1e3a8a;
        }
        
        .grand-total .total-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
        }
        
        .footer {
            margin-top: 60px;
            text-align: center;
            border-top: 2px solid #e5e7eb;
            padding-top: 30px;
        }
        
        .terms {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #2563eb;
        }
        
        .terms-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 10px;
        }
        
        .terms-text {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.6;
        }
        
        .contact-info {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.8;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }
        
        .status-sent {
            background: #d1fae5;
            color: #065f46;
        }
        
        .currency {
            font-weight: bold;
            color: #2563eb;
        }
        
        @media print {
            .container {
                padding: 20px;
            }
            
            .header {
                margin-bottom: 30px;
            }
            
            .info-section {
                margin-bottom: 30px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-name">Inventory Portal</div>
            <div class="company-tagline">Professional Inventory & Quotation Management</div>
            <div class="quotation-title">QUOTATION</div>
            <div class="quotation-number">
                #${quotation._id.toString().slice(-8).toUpperCase()}
                <span class="status-badge status-${quotation.status}">${quotation.status}</span>
            </div>
        </div>

        <!-- Information Section -->
        <div class="info-section">
            <div class="info-block">
                <div class="info-title">Bill To:</div>
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${quotation.customerName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${quotation.customerPhone}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Address:</span>
                    <span class="info-value">${quotation.customerAddress}</span>
                </div>
            </div>
            
            <div class="info-block">
                <div class="info-title">Quotation Details:</div>
                <div class="info-item">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${quotationDate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Valid Until:</span>
                    <span class="info-value">${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span class="info-value">${quotation.status.toUpperCase()}</span>
                </div>
            </div>
        </div>

        <!-- Items Section -->
        <div class="items-section">
            <div class="items-title">Items & Services</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 15%">Product ID</th>
                        <th style="width: 40%">Description</th>
                        <th style="width: 15%" class="text-center">Quantity</th>
                        <th style="width: 15%" class="text-right">Unit Price</th>
                        <th style="width: 15%" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items
                      .map(
                        (item, index) => `
                        <tr>
                            <td><strong>${item.productId}</strong></td>
                            <td>${item.productName}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right"><span class="currency">PKR ${item.price.toLocaleString()}</span></td>
                            <td class="text-right"><span class="currency">PKR ${(item.quantity * item.price).toLocaleString()}</span></td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>

        <!-- Total Section -->
        <div class="total-section">
            <div class="total-row">
                <div class="total-label">Subtotal:</div>
                <div class="total-value"><span class="currency">PKR ${quotation.totalAmount.toLocaleString()}</span></div>
            </div>
            <div class="total-row">
                <div class="total-label">Tax (0%):</div>
                <div class="total-value"><span class="currency">PKR 0</span></div>
            </div>
            <div class="total-row grand-total">
                <div class="total-label">Grand Total:</div>
                <div class="total-value"><span class="currency">PKR ${quotation.totalAmount.toLocaleString()}</span></div>
            </div>
        </div>

        <!-- Terms and Conditions -->
        <div class="terms">
            <div class="terms-title">Terms & Conditions:</div>
            <div class="terms-text">
                • This quotation is valid for 30 days from the date of issue.<br>
                • Prices are subject to change without prior notice.<br>
                • Payment terms: 50% advance, 50% on delivery.<br>
                • Delivery time: 7-14 business days after order confirmation.<br>
                • All prices are in Pakistani Rupees (PKR).<br>
                • Returns are accepted within 7 days of delivery in original condition.
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="contact-info">
                <strong>Inventory Portal</strong><br>
                Email: info@inventoryportal.com | Phone: +92-300-1234567<br>
                Website: www.inventoryportal.com<br>
                <em>Thank you for your business!</em>
            </div>
        </div>
    </div>
</body>
</html>
  `
}

async function generatePDFFromHTML(html: string): Promise<Buffer> {
  // For a simple implementation, we'll use a basic PDF generation approach
  // In production, you should use puppeteer or similar library

  try {
    // Try to use dynamic import for puppeteer if available
    const puppeteer = await import("puppeteer").catch(() => null)

    if (puppeteer) {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })

      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: "networkidle0" })

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      })

      await browser.close()
      return Buffer.from(pdfBuffer)
    }
  } catch (error) {
    console.log("Puppeteer not available, using fallback PDF generation")
  }

  // Fallback: Create a simple PDF using basic PDF structure
  return createSimplePDF(html)
}

function createSimplePDF(html: string): Buffer {
  // Extract text content from HTML for simple PDF
  const textContent = html
    .replace(/<style[^>]*>.*?<\/style>/gs, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // Create a basic PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length ${textContent.length + 200}
>>
stream
BT
/F1 12 Tf
50 750 Td
(QUOTATION) Tj
0 -20 Td
(${textContent.substring(0, 1000).replace(/[()\\]/g, "")}) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000351 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${500 + textContent.length}
%%EOF`

  return Buffer.from(pdfContent, "utf-8")
}
