import { sql } from "@/lib/db"

export interface CheckoutRates {
  shippingCost: number // flat amount, added on top of subtotal
  taxRate: number // percentage applied to subtotal, e.g. 10 means 10%
}

function parseRate(raw: string | undefined): number {
  const n = parseFloat(raw ?? "")
  return Number.isFinite(n) && n > 0 ? n : 0
}

// Reads the admin-configured shipping cost and tax rate from the settings table.
// Fails open (0 / 0) so checkout still works if settings can't be read.
export async function getCheckoutRates(): Promise<CheckoutRates> {
  try {
    const rows = await sql`
      SELECT key, value FROM settings WHERE key IN ('shippingRate', 'taxRate')
    `
    const map: Record<string, string> = {}
    for (const r of rows as any[]) map[r.key] = r.value

    return {
      shippingCost: parseRate(map.shippingRate),
      taxRate: parseRate(map.taxRate),
    }
  } catch {
    return { shippingCost: 0, taxRate: 0 }
  }
}
