import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getVariantStock } from "@/lib/variant-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const size = searchParams.get("size")
    const color = searchParams.get("color")

    // Get product
    const product = await sql`
      SELECT id FROM products WHERE slug = ${params.slug} AND status = 'PUBLISHED'
    `

    if (product.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const productId = product[0].id

    // Get variant stock
    const stock = await getVariantStock(
      productId,
      size || null,
      color || null
    )

    return NextResponse.json({ stock })
  } catch (error: any) {
    console.error("Error fetching variant stock:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch variant stock" },
      { status: 500 }
    )
  }
}



