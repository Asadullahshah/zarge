import { requireAuth } from "@/lib/auth-helpers"
import { DiscountCodesManager } from "@/components/admin/discount-codes-manager"

export default async function DiscountCodesPage() {
  await requireAuth()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold mb-2">Discount Codes</h1>
        <p className="text-[#BDBDBD]">
          Create percentage or fixed cash discount codes. Enabled codes can be applied by
          customers at checkout, after tax and shipping have been added to the total.
        </p>
      </div>

      <DiscountCodesManager />
    </div>
  )
}
