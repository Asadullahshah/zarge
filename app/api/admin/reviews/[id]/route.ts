import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"

export const dynamic = 'force-dynamic'

// DELETE a review (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const reviewId = params.id

    // Check if review exists
    const review = await sql`
      SELECT id FROM reviews WHERE id = ${reviewId}
    `

    if (review.length === 0) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    // Delete the review
    await sql`
      DELETE FROM reviews WHERE id = ${reviewId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting review:", error)
    if (error.message?.includes("redirect")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete review" },
      { status: 500 }
    )
  }
}

// PATCH - Update review status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const reviewId = params.id
    const body = await request.json()
    const { status } = body

    if (!status || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be PENDING, APPROVED, or REJECTED" },
        { status: 400 }
      )
    }

    // Update the review status
    const result = await sql`
      UPDATE reviews
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${reviewId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ review: result[0] })
  } catch (error: any) {
    console.error("Error updating review:", error)
    if (error.message?.includes("redirect")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to update review" },
      { status: 500 }
    )
  }
}

