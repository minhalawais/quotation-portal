import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lowStock = searchParams.get("lowStock")

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    let query = {}
    if (lowStock === "true") {
      query = { quantity: { $lte: 10 } }
    }

    const result = await products.find(query).toArray()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { group, subGroup, productId, name, quantity, price, imagePath } = body

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const products = db.collection("products")

    const result = await products.insertOne({
      group,
      subGroup,
      productId,
      name,
      quantity,
      price,
      imagePath,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Products POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
