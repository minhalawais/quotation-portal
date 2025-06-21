import { notFound } from "next/navigation"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import PublicQuotationView from "@/components/quotations/public-quotation-view"

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

async function getQuotation(id: string): Promise<Quotation | null> {
  try {
    const client = await clientPromise
    const db = client.db("inventory_portal")
    const quotations = db.collection("quotations")
    const products = db.collection("products")

    const quotation = await quotations.findOne({ _id: new ObjectId(id) })

    if (!quotation) {
      return null
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

    return {
      _id: quotation._id.toString(),
      customerName: quotation.customerName,
      customerPhone: quotation.customerPhone,
      customerAddress: quotation.customerAddress,
      totalAmount: quotation.totalAmount,
      status: quotation.status,
      createdAt: quotation.createdAt,
      items: itemsWithDetails,
    }
  } catch (error) {
    console.error("Error fetching quotation:", error)
    return null
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const quotation = await getQuotation(params.id)

  if (!quotation) {
    return {
      title: "Quotation Not Found",
    }
  }

  return {
    title: `Quotation for ${quotation.customerName} - Inventory Portal`,
    description: `Quotation #${quotation._id.slice(-8).toUpperCase()} - Total: PKR ${quotation.totalAmount.toLocaleString()}`,
  }
}

export default async function PublicQuotationPage({ params }: { params: { id: string } }) {
  const quotation = await getQuotation(params.id)

  if (!quotation) {
    notFound()
  }

  return <PublicQuotationView quotation={quotation} />
}
