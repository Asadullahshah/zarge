import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

// List all applied sales (most recent first) with the category name resolved
export async function GET() {
  try {
    await requireAuth()

    const sales = await sql`
      SELECT
        s.id,
        s.percentage,
        s.target,
        s.category_id,
        s.product_ids,
        s.product_count,
        s.created_at,
        c.name AS category_name
      FROM sales s
      LEFT JOIN categories c ON c.id = s.category_id
      ORDER BY s.created_at DESC
    `

    // Self-heal: surface any on-sale products that aren't part of a tracked sale
    // (e.g. sales applied before tracking existed) so they can still be removed.
    const trackedIds = new Set<string>(
      sales.flatMap((s: any) => (s.product_ids || []) as string[])
    )
    const onSale = await sql`
      SELECT id FROM products WHERE sale_price IS NOT NULL AND sale_price > 0
    `
    const untrackedCount = onSale.filter((p: any) => !trackedIds.has(p.id)).length

    const result = sales.map((s: any) => ({
      id: s.id,
      percentage: s.percentage,
      target: s.target,
      category_id: s.category_id,
      category_name: s.category_name,
      product_count: s.product_count,
      created_at: s.created_at,
    }))

    if (untrackedCount > 0) {
      result.push({
        id: "untracked",
        percentage: null,
        target: "MANUAL",
        category_id: null,
        category_name: null,
        product_count: untrackedCount,
        created_at: null,
      })
    }

    return NextResponse.json({ sales: result })
  } catch (error: any) {
    console.error("Error listing sales:", error)
    return NextResponse.json(
      { error: error.message || "Failed to list sales" },
      { status: 500 }
    )
  }
}
