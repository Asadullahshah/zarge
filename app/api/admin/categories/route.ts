import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"
import { slugify } from "@/lib/utils"

export async function GET() {
  try {
    const categories = await sql`
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      GROUP BY c.id
      ORDER BY c.name
    `

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const { name, slug, description, image, imageDesktop, imageMobile, sizeChartImage, parentId } = body

    const categorySlug = slug || slugify(name)

    // Check if slug exists
    const existing = await sql`
      SELECT id FROM categories WHERE slug = ${categorySlug}
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Category with this slug already exists" },
        { status: 400 }
      )
    }

    // Keep legacy `image` populated (defaults to the desktop image) for backward compatibility
    const legacyImage = image || imageDesktop || imageMobile || null

    const result = await sql`
      INSERT INTO categories (name, slug, description, image, image_desktop, image_mobile, size_chart_image, parent_id)
      VALUES (${name}, ${categorySlug}, ${description || null}, ${legacyImage}, ${imageDesktop || null}, ${imageMobile || null}, ${sizeChartImage || null}, ${parentId || null})
      RETURNING *
    `

    return NextResponse.json({ category: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    )
  }
}

