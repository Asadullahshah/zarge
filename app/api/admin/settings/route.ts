import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET() {
  try {
    await requireAuth()

    const settings = await sql`
      SELECT * FROM settings ORDER BY key
    `

    return NextResponse.json({ settings })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()

    for (const [key, value] of Object.entries(body)) {
      await sql`
        INSERT INTO settings (key, value, type, updated_by)
        VALUES (${key}, ${String(value)}, 'text', ${session.user.id})
        ON CONFLICT (key) 
        DO UPDATE SET 
          value = EXCLUDED.value,
          updated_at = NOW(),
          updated_by = EXCLUDED.updated_by
      `
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: 500 }
    )
  }
}

