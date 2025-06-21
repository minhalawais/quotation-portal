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

    // Use the same serverless PDF generation function
    const pdfBuffer = await generateServerlessPDF(quotation, itemsWithDetails)

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

// Import the same function from the public route
async function generateServerlessPDF(quotation: any, items: any[]): Promise<Buffer> {
  try {
    // Try puppeteer-core with chromium for serverless environments
    const puppeteerCore = await import("puppeteer-core").catch(() => null)
    const chromium = await import("@sparticuz/chromium").catch(() => null)

    if (puppeteerCore && chromium) {
      console.log("Using puppeteer-core with chromium for serverless")

      const browser = await puppeteerCore.default.launch({
        args: chromium.default.args,
        defaultViewport: chromium.default.defaultViewport,
        executablePath: await chromium.default.executablePath(),
        headless: chromium.default.headless,
      })

      const page = await browser.newPage()
      const htmlContent = generateQuotationHTML(quotation, items)

      await page.setContent(htmlContent, { waitUntil: "networkidle0" })

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
    console.log("Serverless puppeteer failed, trying regular puppeteer:", error)
  }

  try {
    // Fallback to regular puppeteer for local development
    const puppeteer = await import("puppeteer").catch(() => null)

    if (puppeteer) {
      console.log("Using regular puppeteer")

      const browser = await puppeteer.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })

      const page = await browser.newPage()
      const htmlContent = generateQuotationHTML(quotation, items)

      await page.setContent(htmlContent, { waitUntil: "networkidle0" })

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
    console.log("Regular puppeteer failed, using React PDF:", error)
  }

  // Final fallback: Use React PDF for serverless compatibility
  return await generateReactPDF(quotation, items)
}

async function generateReactPDF(quotation: any, items: any[]): Promise<Buffer> {
  try {
    const ReactPDF = await import("@react-pdf/renderer")
    const { Document, Page, Text, View, StyleSheet, pdf } = ReactPDF

    // Define styles
    const styles = StyleSheet.create({
      page: {
        flexDirection: "column",
        backgroundColor: "#ffffff",
        padding: 30,
        fontFamily: "Helvetica",
      },
      header: {
        marginBottom: 20,
        textAlign: "center",
        borderBottom: "3 solid #2563eb",
        paddingBottom: 15,
      },
      companyName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#2563eb",
        marginBottom: 5,
      },
      companyTagline: {
        fontSize: 12,
        color: "#666666",
        marginBottom: 15,
      },
      quotationTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 8,
      },
      quotationNumber: {
        fontSize: 12,
        color: "#666666",
        backgroundColor: "#f3f4f6",
        padding: 8,
        borderRadius: 15,
      },
      infoSection: {
        flexDirection: "row",
        marginBottom: 25,
        gap: 30,
      },
      infoBlock: {
        flex: 1,
      },
      infoTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#2563eb",
        marginBottom: 10,
        borderBottom: "1 solid #e5e7eb",
        paddingBottom: 3,
      },
      infoItem: {
        flexDirection: "row",
        marginBottom: 5,
      },
      infoLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#374151",
        width: 60,
      },
      infoValue: {
        fontSize: 10,
        color: "#6b7280",
        flex: 1,
      },
      itemsSection: {
        marginBottom: 25,
      },
      itemsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e3a8a",
        textAlign: "center",
        marginBottom: 15,
        backgroundColor: "#2563eb",
        color: "#ffffff",
        padding: 10,
      },
      tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f9fafb",
        padding: 8,
        borderBottom: "1 solid #e5e7eb",
      },
      tableRow: {
        flexDirection: "row",
        padding: 8,
        borderBottom: "1 solid #e5e7eb",
      },
      tableCell: {
        fontSize: 9,
        color: "#374151",
      },
      tableCellHeader: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#374151",
      },
      productId: {
        width: "15%",
      },
      description: {
        width: "40%",
      },
      quantity: {
        width: "15%",
        textAlign: "center",
      },
      unitPrice: {
        width: "15%",
        textAlign: "right",
      },
      total: {
        width: "15%",
        textAlign: "right",
        fontWeight: "bold",
        color: "#2563eb",
      },
      totalSection: {
        marginTop: 20,
        alignItems: "flex-end",
      },
      totalRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 5,
        width: 250,
      },
      totalLabel: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#374151",
        width: 100,
        textAlign: "right",
        marginRight: 15,
      },
      totalValue: {
        fontSize: 12,
        color: "#6b7280",
        width: 100,
        textAlign: "right",
      },
      grandTotal: {
        borderTop: "2 solid #2563eb",
        paddingTop: 10,
        marginTop: 10,
      },
      grandTotalLabel: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1e3a8a",
      },
      grandTotalValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2563eb",
      },
      terms: {
        backgroundColor: "#f9fafb",
        padding: 15,
        marginTop: 25,
        borderLeft: "4 solid #2563eb",
      },
      termsTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 8,
      },
      termsText: {
        fontSize: 9,
        color: "#6b7280",
        lineHeight: 1.4,
      },
      footer: {
        marginTop: 30,
        textAlign: "center",
        borderTop: "2 solid #e5e7eb",
        paddingTop: 20,
      },
      contactInfo: {
        fontSize: 10,
        color: "#6b7280",
        lineHeight: 1.6,
      },
    })

    // Create PDF document
    const React = await import("react")

    const MyDocument = () =>
      React.createElement(
        Document,
        null,
        React.createElement(
          Page,
          { size: "A4", style: styles.page },
          // Header
          React.createElement(
            View,
            { style: styles.header },
            React.createElement(Text, { style: styles.companyName }, "Inventory Portal"),
            React.createElement(
              Text,
              { style: styles.companyTagline },
              "Professional Inventory & Quotation Management",
            ),
            React.createElement(Text, { style: styles.quotationTitle }, "QUOTATION"),
            React.createElement(
              Text,
              { style: styles.quotationNumber },
              `#${quotation._id.toString().slice(-8).toUpperCase()} - ${quotation.status.toUpperCase()}`,
            ),
          ),

          // Information Section
          React.createElement(
            View,
            { style: styles.infoSection },
            React.createElement(
              View,
              { style: styles.infoBlock },
              React.createElement(Text, { style: styles.infoTitle }, "Bill To:"),
              React.createElement(
                View,
                { style: styles.infoItem },
                React.createElement(Text, { style: styles.infoLabel }, "Name:"),
                React.createElement(Text, { style: styles.infoValue }, quotation.customerName),
              ),
              React.createElement(
                View,
                { style: styles.infoItem },
                React.createElement(Text, { style: styles.infoLabel }, "Phone:"),
                React.createElement(Text, { style: styles.infoValue }, quotation.customerPhone),
              ),
              React.createElement(
                View,
                { style: styles.infoItem },
                React.createElement(Text, { style: styles.infoLabel }, "Address:"),
                React.createElement(Text, { style: styles.infoValue }, quotation.customerAddress),
              ),
            ),
            React.createElement(
              View,
              { style: styles.infoBlock },
              React.createElement(Text, { style: styles.infoTitle }, "Quotation Details:"),
              React.createElement(
                View,
                { style: styles.infoItem },
                React.createElement(Text, { style: styles.infoLabel }, "Date:"),
                React.createElement(
                  Text,
                  { style: styles.infoValue },
                  new Date(quotation.createdAt).toLocaleDateString(),
                ),
              ),
              React.createElement(
                View,
                { style: styles.infoItem },
                React.createElement(Text, { style: styles.infoLabel }, "Valid Until:"),
                React.createElement(
                  Text,
                  { style: styles.infoValue },
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                ),
              ),
              React.createElement(
                View,
                { style: styles.infoItem },
                React.createElement(Text, { style: styles.infoLabel }, "Status:"),
                React.createElement(Text, { style: styles.infoValue }, quotation.status.toUpperCase()),
              ),
            ),
          ),

          // Items Section
          React.createElement(
            View,
            { style: styles.itemsSection },
            React.createElement(Text, { style: styles.itemsTitle }, "Items & Services"),

            // Table Header
            React.createElement(
              View,
              { style: styles.tableHeader },
              React.createElement(Text, { style: [styles.tableCellHeader, styles.productId] }, "Product ID"),
              React.createElement(Text, { style: [styles.tableCellHeader, styles.description] }, "Description"),
              React.createElement(Text, { style: [styles.tableCellHeader, styles.quantity] }, "Qty"),
              React.createElement(Text, { style: [styles.tableCellHeader, styles.unitPrice] }, "Unit Price"),
              React.createElement(Text, { style: [styles.tableCellHeader, styles.total] }, "Total"),
            ),

            // Table Rows
            ...items.map((item, index) =>
              React.createElement(
                View,
                {
                  key: index,
                  style: [styles.tableRow, { backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb" }],
                },
                React.createElement(Text, { style: [styles.tableCell, styles.productId] }, item.productId),
                React.createElement(Text, { style: [styles.tableCell, styles.description] }, item.productName),
                React.createElement(Text, { style: [styles.tableCell, styles.quantity] }, item.quantity.toString()),
                React.createElement(
                  Text,
                  { style: [styles.tableCell, styles.unitPrice] },
                  `PKR ${item.price.toLocaleString()}`,
                ),
                React.createElement(
                  Text,
                  { style: [styles.tableCell, styles.total] },
                  `PKR ${(item.quantity * item.price).toLocaleString()}`,
                ),
              ),
            ),
          ),

          // Total Section
          React.createElement(
            View,
            { style: styles.totalSection },
            React.createElement(
              View,
              { style: styles.totalRow },
              React.createElement(Text, { style: styles.totalLabel }, "Subtotal:"),
              React.createElement(Text, { style: styles.totalValue }, `PKR ${quotation.totalAmount.toLocaleString()}`),
            ),
            React.createElement(
              View,
              { style: styles.totalRow },
              React.createElement(Text, { style: styles.totalLabel }, "Tax (0%):"),
              React.createElement(Text, { style: styles.totalValue }, "PKR 0"),
            ),
            React.createElement(
              View,
              { style: [styles.totalRow, styles.grandTotal] },
              React.createElement(Text, { style: styles.grandTotalLabel }, "Grand Total:"),
              React.createElement(
                Text,
                { style: styles.grandTotalValue },
                `PKR ${quotation.totalAmount.toLocaleString()}`,
              ),
            ),
          ),

          // Terms and Conditions
          React.createElement(
            View,
            { style: styles.terms },
            React.createElement(Text, { style: styles.termsTitle }, "Terms & Conditions:"),
            React.createElement(
              Text,
              { style: styles.termsText },
              "• This quotation is valid for 30 days from the date of issue.\n" +
                "• Prices are subject to change without prior notice.\n" +
                "• Payment terms: 50% advance, 50% on delivery.\n" +
                "• Delivery time: 7-14 business days after order confirmation.\n" +
                "• All prices are in Pakistani Rupees (PKR).\n" +
                "• Returns are accepted within 7 days of delivery in original condition.",
            ),
          ),

          // Footer
          React.createElement(
            View,
            { style: styles.footer },
            React.createElement(
              Text,
              { style: styles.contactInfo },
              "Inventory Portal\n" +
                "Email: info@inventoryportal.com | Phone: +92-300-1234567\n" +
                "Website: www.inventoryportal.com\n" +
                "Thank you for your business!",
            ),
          ),
        ),
      )

    // Generate PDF
    const pdfDoc = MyDocument()
    const pdfBuffer = await pdf(pdfDoc).toBuffer()

    return pdfBuffer
  } catch (error) {
    console.error("React PDF generation failed:", error)
    throw new Error("PDF generation failed")
  }
}

function generateQuotationHTML(quotation: any, items: any[]) {
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
