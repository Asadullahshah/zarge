import { NextRequest, NextResponse } from "next/server"
import { findEnabledDiscountCode } from "@/lib/discount-codes"

export const dynamic = "force-dynamic"

// Public endpoint: checkout calls this to check whether a discount code is valid and enabled.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = typeof body.code === "string" ? body.code : ""

    const discount = await findEnabledDiscountCode(code)
    if (!discount) {
      return NextResponse.json(
        { valid: false, error: "Invalid or expired discount code" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
    })
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error.message || "Failed to validate discount code" },
      { status: 500 }
    )
  }
}
