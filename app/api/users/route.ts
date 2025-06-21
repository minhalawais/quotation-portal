import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "manager") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const users = db.collection("users")

    const result = await users.find({}, { projection: { password: 0 } }).toArray()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Users API error:", error)
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
    const { name, email, password, role, contact } = body

    const hashedPassword = await bcrypt.hash(password, 12)

    const client = await clientPromise
    const db = client.db("inventory_portal")
    const users = db.collection("users")

    const result = await users.insertOne({
      name,
      email,
      password: hashedPassword,
      role,
      contact,
      createdAt: new Date(),
    })

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Users POST error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
