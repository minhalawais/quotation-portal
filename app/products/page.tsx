import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import ProductList from "@/components/products/product-list"
import ProductFilters from "@/components/products/product-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Mobile Header */}
      <div className="flex items-center justify-between lg:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-600">Manage your inventory</p>
        </div>
        {session.user.role === "manager" && (
          <Link href="/products/add">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your inventory and product catalog</p>
        </div>
        {session.user.role === "manager" && (
          <Link href="/products/add">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        )}
      </div>

      <ProductFilters />
      <ProductList userRole={session.user.role} />
    </div>
  )
}
