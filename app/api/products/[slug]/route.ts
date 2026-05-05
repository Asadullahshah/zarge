import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await sql`
      SELECT * FROM products WHERE slug = ${params.slug} AND status = 'PUBLISHED'
    `

    if (product.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const [productData] = product

    // Get images
    const images = await sql`
      SELECT * FROM product_images
      WHERE product_id = ${productData.id}
      ORDER BY "order" ASC
    `

    // Get variants
    const variants = await sql`
      SELECT * FROM variants
      WHERE product_id = ${productData.id}
      ORDER BY created_at ASC
    `

    // Get categories
    const categories = await sql`
      SELECT c.* FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ${productData.id}
    `

    return NextResponse.json({
      ...productData,
      images,
      variants,
      categories,
    })
  } catch (error: any) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch product" },
      { status: 500 }
    )
  }
}

