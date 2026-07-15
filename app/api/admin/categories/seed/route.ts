import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    // Top-level t-shirt drops (the two collections the store is built around)
    const drops = [
      { name: 'Unspoken Resilience', slug: 'unspoken-resilience', description: 'T-shirt drop: Unspoken Resilience' },
      { name: 'Still Becoming', slug: 'still-becoming', description: 'T-shirt drop: Still Becoming' },
    ]

    for (const drop of drops) {
      await sql`
        INSERT INTO categories (name, slug, description)
        VALUES (${drop.name}, ${drop.slug}, ${drop.description})
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
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

