import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  try {
    const rows = await sql`
      SELECT enabled, message FROM site_settings WHERE key = 'promo_banner'
    `
    const setting = rows[0] || { enabled: false, message: "" }
    return NextResponse.json(setting)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch promo banner setting" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const { enabled, message } = body

    if (typeof enabled !== "boolean" || typeof message !== "string") {
      return NextResponse.json(
        { error: "enabled must be a boolean and message must be a string" },
        { status: 400 }
      )
    }

    await sql`
      INSERT INTO site_settings (key, enabled, message)
      VALUES ('promo_banner', ${enabled}, ${message})
      ON CONFLICT (key) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        message = EXCLUDED.message,
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update promo banner setting" },
      { status: 500 }
    )
  }
}
