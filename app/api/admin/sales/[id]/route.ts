import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

// Remove an applied sale: revert sale_price to null for its products, then delete the record
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    // Special case: clear all on-sale products not covered by a tracked sale
    if (params.id === "untracked") {
      const tracked = await sql`SELECT product_ids FROM sales`
      const trackedIds = tracked.flatMap((r: any) => (r.product_ids || []) as string[])
      if (trackedIds.length > 0) {
        const literal = `{${trackedIds.join(",")}}`
        await sql`
          UPDATE products SET sale_price = NULL
          WHERE sale_price IS NOT NULL AND id <> ALL(${literal}::uuid[])
        `
      } else {
        await sql`UPDATE products SET sale_price = NULL WHERE sale_price IS NOT NULL`
      }
      return NextResponse.json({ success: true })
    }

    const rows = await sql`SELECT product_ids FROM sales WHERE id = ${params.id}`
    if (rows.length === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    const productIds: string[] = rows[0].product_ids || []

    if (productIds.length > 0) {
      const literal = `{${productIds.join(",")}}`
      await sql`
        UPDATE products
        SET sale_price = NULL
        WHERE id = ANY(${literal}::uuid[])
      `
    }

    await sql`DELETE FROM sales WHERE id = ${params.id}`

    return NextResponse.json({ success: true, revertedCount: productIds.length })
  } catch (error: any) {
    console.error("Error removing sale:", error)
    return NextResponse.json(
      { error: error.message || "Failed to remove sale" },
      { status: 500 }
    )
  }
}
