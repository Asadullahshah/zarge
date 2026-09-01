import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await requireAuth()

    const codes = await sql`
      SELECT id, code, type, value, enabled, created_at, updated_at
      FROM discount_codes
      ORDER BY created_at DESC
    `

    return NextResponse.json({ discountCodes: codes })
  } catch (error: any) {
    console.error("Error listing discount codes:", error)
    return NextResponse.json(
      { error: error.message || "Failed to list discount codes" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const code = (body.code || "").trim().toUpperCase()
    const type = body.type
    const value = parseFloat(body.value)
    const enabled = body.enabled !== false

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }
    if (type !== "PERCENTAGE" && type !== "FIXED") {
      return NextResponse.json(
        { error: "Type must be PERCENTAGE or FIXED" },
        { status: 400 }
      )
    }
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Value must be a positive number" }, { status: 400 })
    }
    if (type === "PERCENTAGE" && value > 100) {
      return NextResponse.json({ error: "Percentage cannot exceed 100" }, { status: 400 })
    }

    const existing = await sql`
      SELECT id FROM discount_codes WHERE UPPER(code) = ${code}
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: "A discount code with this name already exists" }, { status: 409 })
    }

    const created = await sql`
      INSERT INTO discount_codes (code, type, value, enabled)
      VALUES (${code}, ${type}, ${value}, ${enabled})
      RETURNING id, code, type, value, enabled, created_at, updated_at
    `

    return NextResponse.json({ discountCode: created[0] }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating discount code:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create discount code" },
      { status: 500 }
    )
  }
}
