import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"
import { slugify } from "@/lib/utils"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const body = await request.json()
    const { name, slug, description, image, sizeChartImage, parentId } = body

    const categorySlug = slug || slugify(name)

    // Check if slug exists for another category
    const slugCheck = await sql`
      SELECT id FROM categories WHERE slug = ${categorySlug} AND id != ${params.id}
    `
    if (slugCheck.length > 0) {
      return NextResponse.json(
        { error: "Category with this slug already exists" },
        { status: 400 }
      )
    }

    await sql`
      UPDATE categories SET
        name = ${name},
        slug = ${categorySlug},
        description = ${description || null},
        image = ${image || null},
        size_chart_image = ${sizeChartImage || null},
        parent_id = ${parentId || null},
        updated_at = NOW()
      WHERE id = ${params.id}
    `

    const updated = await sql`
      SELECT * FROM categories WHERE id = ${params.id}
    `

    return NextResponse.json({ category: updated[0] })
  } catch (error: any) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    // Check if category has products
    const products = await sql`
      SELECT COUNT(*) as count FROM product_categories WHERE category_id = ${params.id}
    `
    if (parseInt(products[0]?.count || "0") > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with products" },
        { status: 400 }
      )
    }

    await sql`DELETE FROM categories WHERE id = ${params.id}`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    )
  }
}

