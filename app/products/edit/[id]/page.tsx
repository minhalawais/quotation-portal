import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import EditProductForm from "@/components/products/edit-product-form"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "manager") {
    redirect("/auth/signin")
  }

  const { id } = await params

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update product information and details</p>
      </div>
      <EditProductForm productId={id} />
    </div>
  )
}
