import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"

export const dynamic = 'force-dynamic'

// GET all reviews with filters (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const productId = searchParams.get("productId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    // Build query with proper conditions
    let reviews: any[]
    let countResult: any[]

    if (status && productId) {
      reviews = await sql`
        SELECT 
          r.*,
          p.name as product_name,
          p.slug as product_slug,
          u.email as user_email_from_account
        FROM reviews r
        LEFT JOIN products p ON r.product_id = p.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.status = ${status} AND r.product_id = ${productId}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM reviews 
        WHERE status = ${status} AND product_id = ${productId}
      `
    } else if (status) {
      reviews = await sql`
        SELECT 
          r.*,
          p.name as product_name,
          p.slug as product_slug,
          u.email as user_email_from_account
        FROM reviews r
        LEFT JOIN products p ON r.product_id = p.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.status = ${status}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM reviews WHERE status = ${status}
      `
    } else if (productId) {
      reviews = await sql`
        SELECT 
          r.*,
          p.name as product_name,
          p.slug as product_slug,
          u.email as user_email_from_account
        FROM reviews r
        LEFT JOIN products p ON r.product_id = p.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ${productId}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM reviews WHERE product_id = ${productId}
      `
    } else {
      reviews = await sql`
        SELECT 
          r.*,
          p.name as product_name,
          p.slug as product_slug,
          u.email as user_email_from_account
        FROM reviews r
        LEFT JOIN products p ON r.product_id = p.id
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM reviews
      `
    }
    const total = parseInt(countResult[0]?.total || "0")

    return NextResponse.json({
      reviews: reviews.map((review: any) => ({
        id: review.id,
        productId: review.product_id,
        productName: review.product_name,
        productSlug: review.product_slug,
        userId: review.user_id,
        userName: review.user_name || review.user_name_from_account,
        userEmail: review.user_email || review.user_email_from_account,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error: any) {
    console.error("Error fetching reviews:", error)
    if (error.message?.includes("redirect")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

