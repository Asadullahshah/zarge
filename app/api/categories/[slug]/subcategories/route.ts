import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Get parent category
    const parent = await sql`
      SELECT id FROM categories WHERE slug = ${params.slug}
    `

    if (parent.length === 0) {
      return NextResponse.json({ subcategories: [] })
    }

    const parentId = parent[0].id

    // Get subcategories with at least 1 published product
    const subcategories = await sql`
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count
      FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      INNER JOIN products p ON pc.product_id = p.id AND p.status = 'PUBLISHED'
      WHERE c.parent_id = ${parentId}
      GROUP BY c.id
      HAVING COUNT(DISTINCT pc.product_id) > 0
      ORDER BY c.name
    `

    return NextResponse.json({ subcategories })
  } catch (error: any) {
    console.error("Error fetching subcategories:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch subcategories" },
      { status: 500 }
    )
  }
}

