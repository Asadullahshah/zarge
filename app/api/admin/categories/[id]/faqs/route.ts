import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const faqs = await sql`
      SELECT * FROM category_faqs
      WHERE category_id = ${params.id}
      ORDER BY "order" ASC, created_at ASC
    `

    return NextResponse.json({ faqs })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch FAQs" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const body = await request.json()
    const { faqs } = body

    // Delete existing FAQs
    await sql`DELETE FROM category_faqs WHERE category_id = ${params.id}`

    // Insert new FAQs
    for (let i = 0; i < faqs.length; i++) {
      const faq = faqs[i]
      if (faq.question && faq.answer) {
        await sql`
          INSERT INTO category_faqs (category_id, question, answer, "order")
          VALUES (${params.id}, ${faq.question}, ${faq.answer}, ${i})
        `
      }
    }

    const updated = await sql`
      SELECT * FROM category_faqs
      WHERE category_id = ${params.id}
      ORDER BY "order" ASC
    `

    return NextResponse.json({ faqs: updated })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save FAQs" },
      { status: 500 }
    )
  }
}

