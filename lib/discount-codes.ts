import { sql } from "@/lib/db"

export type DiscountType = "PERCENTAGE" | "FIXED"

export interface DiscountCode {
  code: string
  type: DiscountType
  value: number
}

// Looks up an enabled discount code (case-insensitive). Returns null if it doesn't exist or is disabled.
export async function findEnabledDiscountCode(code: string): Promise<DiscountCode | null> {
  const trimmed = code?.trim()
  if (!trimmed) return null

  const rows = await sql`
    SELECT code, type, value FROM discount_codes
    WHERE UPPER(code) = UPPER(${trimmed}) AND enabled = true
    LIMIT 1
  `
  if (rows.length === 0) return null

  return {
    code: rows[0].code,
    type: rows[0].type,
    value: parseFloat(rows[0].value),
  }
}

// Computes the discount amount off a final total (subtotal + tax + shipping), clamped so it never exceeds the total.
export function computeDiscountAmount(total: number, discount: DiscountCode): number {
  const raw = discount.type === "PERCENTAGE" ? (total * discount.value) / 100 : discount.value
  const clamped = Math.max(0, Math.min(raw, total))
  return Math.round(clamped * 100) / 100
}
