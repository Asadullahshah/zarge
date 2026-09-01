import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

// Partial update - primarily used to toggle `enabled`, but also supports editing type/value.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const body = await request.json()

    const enabledVal: boolean | null = typeof body.enabled === "boolean" ? body.enabled : null

    let typeVal: string | null = null
    if (body.type !== undefined) {
      if (body.type !== "PERCENTAGE" && body.type !== "FIXED") {
        return NextResponse.json({ error: "Type must be PERCENTAGE or FIXED" }, { status: 400 })
      }
      typeVal = body.type
    }

    let valueVal: number | null = null
    if (body.value !== undefined) {
      const value = parseFloat(body.value)
      if (!Number.isFinite(value) || value <= 0) {
        return NextResponse.json({ error: "Value must be a positive number" }, { status: 400 })
      }
      valueVal = value
    }

    if (enabledVal === null && typeVal === null && valueVal === null) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const result = await sql`
      UPDATE discount_codes SET
        enabled = COALESCE(${enabledVal}, enabled),
        type = COALESCE(${typeVal}, type),
        value = COALESCE(${valueVal}, value),
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING id, code, type, value, enabled, created_at, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 })
    }

    return NextResponse.json({ discountCode: result[0] })
  } catch (error: any) {
    console.error("Error updating discount code:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update discount code" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const result = await sql`DELETE FROM discount_codes WHERE id = ${params.id} RETURNING id`
    if (result.length === 0) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting discount code:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete discount code" },
      { status: 500 }
    )
  }
}
