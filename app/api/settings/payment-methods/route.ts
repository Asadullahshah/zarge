import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

// Public endpoint: which payment methods are enabled (used by checkout).
// Defaults to COD + Stripe enabled when unset.
export async function GET() {
  try {
    const rows = await sql`
      SELECT key, value FROM settings WHERE key LIKE 'payment_%'
    `
    const map: Record<string, string> = {}
    for (const r of rows as any[]) map[r.key] = r.value

    const isOn = (key: string, fallback: boolean) =>
      map[key] === undefined ? fallback : map[key] === "true"

    // Stripe can only be offered if a real secret key is configured (not the "sk_test_..." placeholder)
    const stripeSecret = process.env.STRIPE_SECRET_KEY
    const stripeConfigured =
      !!stripeSecret && stripeSecret.startsWith("sk_") && !stripeSecret.includes("...")

    return NextResponse.json({
      stripe: isOn("payment_stripe_enabled", true) && stripeConfigured,
      cod: isOn("payment_cod_enabled", true),
      bank: isOn("payment_bank_enabled", false),
      bankDetails: map["payment_bank_details"] || "",
    })
  } catch (error: any) {
    // Fail open so checkout still works
    return NextResponse.json({ stripe: true, cod: true, bank: false, bankDetails: "" })
  }
}
