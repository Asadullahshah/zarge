import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import { PoliciesForm } from "@/components/admin/policies-form"
import { POLICY_DEFAULTS } from "@/lib/policies"

export const dynamic = "force-dynamic"

export default async function PoliciesPage() {
  await requireAuth()

  const settings = await sql`SELECT key, value FROM settings WHERE key LIKE 'policy_%'`
  const settingsMap = (settings as any[]).reduce((acc: Record<string, string>, s: any) => {
    acc[s.key] = s.value
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold">Policies</h1>
        <p className="text-[#BDBDBD] mt-1">
          Edit the Return &amp; Exchange and Shipping policy pages shown to customers.
        </p>
      </div>

      <div className="max-w-4xl">
        <PoliciesForm
          initialSettings={settingsMap}
          defaults={{
            exchange: { title: POLICY_DEFAULTS.exchange.title, content: POLICY_DEFAULTS.exchange.content },
            shipping: { title: POLICY_DEFAULTS.shipping.title, content: POLICY_DEFAULTS.shipping.content },
          }}
        />
      </div>
    </div>
  )
}
