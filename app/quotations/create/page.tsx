import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import QuotationForm from "@/components/quotations/quotation-form"

export default async function CreateQuotationPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Create Quotation</h1>
      <QuotationForm userId={session.user.id} />
    </div>
  )
}
