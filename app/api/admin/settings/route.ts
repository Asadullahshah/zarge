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

    const entries = Object.entries(body)
    if (entries.length === 0) {
      return NextResponse.json({ success: true })
    }

    const keys = entries.map(([k]) => k)
    const values = entries.map(([, v]) => String(v))

    // Single batched upsert (one round-trip) with a small retry to ride out
    // transient Neon "fetch failed" / cold-start blips.
    let lastErr: any = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await sql`
          INSERT INTO settings (key, value, type, updated_by)
          SELECT k, v, 'text', ${session.user.id}
          FROM unnest(${keys}::text[], ${values}::text[]) AS t(k, v)
          ON CONFLICT (key)
          DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = NOW(),
            updated_by = EXCLUDED.updated_by
        `
        return NextResponse.json({ success: true })
      } catch (err: any) {
        lastErr = err
        const msg = String(err?.message || "")
        // Only retry on transient connection errors
        if (!/fetch failed|ECONNRESET|ETIMEDOUT|Connection terminated|timeout/i.test(msg)) {
          throw err
        }
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)))
      }
    }
    throw lastErr
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: 500 }
    )
  }
}

