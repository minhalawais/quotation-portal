import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import ProductForm from "@/components/products/product-form"

export default async function AddProductPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "manager") {
    redirect("/auth/signin")
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Add New Product</h1>
      <ProductForm />
    </div>
  )
}
