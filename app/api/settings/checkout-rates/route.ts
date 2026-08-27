import { NextResponse } from "next/server"
import { getCheckoutRates } from "@/lib/store-settings"

export const dynamic = "force-dynamic"

// Public endpoint: current shipping cost + tax rate (used by checkout to display totals).
export async function GET() {
  const rates = await getCheckoutRates()
  return NextResponse.json(rates)
}
