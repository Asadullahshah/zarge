import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO messages (name, email, phone, subject, message)
      VALUES (${name}, ${email}, ${phone || null}, ${subject || null}, ${message})
      RETURNING *
    `

    return NextResponse.json(
      { success: true, message: result[0] },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error saving message:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    )
  }
}

