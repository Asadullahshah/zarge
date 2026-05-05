import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    // Create parent categories
    const menCategory = await sql`
      INSERT INTO categories (name, slug, description)
      VALUES ('Men', 'men', 'Men''s fashion and apparel')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING *
    `

    const womenCategory = await sql`
      INSERT INTO categories (name, slug, description)
      VALUES ('Women', 'women', 'Women''s fashion and apparel')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING *
    `

    const homeCategory = await sql`
      INSERT INTO categories (name, slug, description)
      VALUES ('Home Essentials', 'home-essentials', 'Home textiles and essentials')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING *
    `

    const menId = menCategory[0].id
    const womenId = womenCategory[0].id
    const homeId = homeCategory[0].id

    // Men's subcategories
    const menSubcategories = [
      { name: 'Unstitched', slug: 'men-unstitched' },
      { name: 'Stitched', slug: 'men-stitched' },
      { name: 'Formal Wear', slug: 'men-formal-wear' },
      { name: 'Semi Formal / Smart Casual', slug: 'men-semi-formal' },
      { name: 'Winter Wear', slug: 'men-winter-wear' },
    ]

    // Women's subcategories
    const womenSubcategories = [
      { name: 'Unstitched', slug: 'women-unstitched' },
      { name: 'Stitched / Pret', slug: 'women-stitched-pret' },
      { name: 'Formal / Luxury', slug: 'women-formal-luxury' },
      { name: 'Bottoms & Dupattas', slug: 'women-bottoms-dupattas' },
    ]

    // Home Essentials subcategories
    const homeSubcategories = [
      { name: 'Bed Sheets', slug: 'bed-sheets' },
      { name: 'Quilt & Comforters', slug: 'quilt-comforters' },
      { name: 'Pillow & Cushion Covers', slug: 'pillow-cushion-covers' },
      { name: 'Blankets', slug: 'blankets' },
      { name: 'Towels / Bath', slug: 'towels-bath' },
      { name: 'Curtains, Mats', slug: 'curtains-mats' },
    ]

    // Insert Men's subcategories
    for (const subcat of menSubcategories) {
      await sql`
        INSERT INTO categories (name, slug, parent_id)
        VALUES (${subcat.name}, ${subcat.slug}, ${menId})
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id
      `
    }

    // Insert Women's subcategories
    for (const subcat of womenSubcategories) {
      await sql`
        INSERT INTO categories (name, slug, parent_id)
        VALUES (${subcat.name}, ${subcat.slug}, ${womenId})
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id
      `
    }

    // Insert Home Essentials subcategories
    for (const subcat of homeSubcategories) {
      await sql`
        INSERT INTO categories (name, slug, parent_id)
        VALUES (${subcat.name}, ${subcat.slug}, ${homeId})
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id
      `
    }

    return NextResponse.json({ success: true, message: 'Categories seeded successfully' })
  } catch (error: any) {
    console.error('Error seeding categories:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed categories' },
      { status: 500 }
    )
  }
}

