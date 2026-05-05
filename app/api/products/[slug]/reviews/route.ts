import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { auth } from "@/lib/auth"

// GET reviews for a product (only approved reviews)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Get product by slug
    const products = await sql`
      SELECT id FROM products WHERE slug = ${params.slug} AND status = 'PUBLISHED'
    `
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }
    
    const productId = products[0].id
    
    // Get approved reviews
    const reviews = await sql`
      SELECT 
        r.*,
        u.name as user_name_from_account,
        u.email as user_email_from_account,
        u.image as user_image
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ${productId}
        AND r.status = 'APPROVED'
      ORDER BY r.created_at DESC
    `
    
    // Calculate average rating
    const ratingStats = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating)::numeric(3,2) as average_rating,
        COUNT(*) FILTER (WHERE rating = 5) as five_star,
        COUNT(*) FILTER (WHERE rating = 4) as four_star,
        COUNT(*) FILTER (WHERE rating = 3) as three_star,
        COUNT(*) FILTER (WHERE rating = 2) as two_star,
        COUNT(*) FILTER (WHERE rating = 1) as one_star
      FROM reviews
      WHERE product_id = ${productId} AND status = 'APPROVED'
    `
    
    return NextResponse.json({
      reviews: reviews.map((review: any) => ({
        id: review.id,
        productId: review.product_id,
        userId: review.user_id,
        userName: review.user_name || review.user_name_from_account,
        userEmail: review.user_email || review.user_email_from_account,
        userImage: review.user_image,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
      })),
      stats: ratingStats.length > 0 ? {
        totalReviews: parseInt(ratingStats[0].total_reviews || '0'),
        averageRating: parseFloat(ratingStats[0].average_rating || '0'),
        ratingDistribution: {
          5: parseInt(ratingStats[0].five_star || '0'),
          4: parseInt(ratingStats[0].four_star || '0'),
          3: parseInt(ratingStats[0].three_star || '0'),
          2: parseInt(ratingStats[0].two_star || '0'),
          1: parseInt(ratingStats[0].one_star || '0'),
        }
      } : {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    })
  } catch (error: any) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

// POST a new review
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    const body = await request.json()
    const { rating, comment, userName, userEmail } = body
    
    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }
    
    // Comment is optional
    
    if (!userName || userName.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }
    
    // Get product by slug
    const products = await sql`
      SELECT id FROM products WHERE slug = ${params.slug} AND status = 'PUBLISHED'
    `
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }
    
    const productId = products[0].id
    const userId = session?.user?.id || null
    
    // Check if user already reviewed this product
    if (userId) {
      const existingReview = await sql`
        SELECT id FROM reviews 
        WHERE product_id = ${productId} AND user_id = ${userId}
      `
      
      if (existingReview.length > 0) {
        return NextResponse.json(
          { error: "You have already reviewed this product" },
          { status: 400 }
        )
      }
    }
    
    // Determine status based on rating: 4-5 stars = APPROVED, 1-3 stars = PENDING
    const reviewStatus = rating >= 4 ? 'APPROVED' : 'PENDING'
    
    // Create review (auto-approved for 4-5 stars, pending for 1-3 stars)
    const result = await sql`
      INSERT INTO reviews (product_id, user_id, user_name, user_email, rating, comment, status)
      VALUES (${productId}, ${userId}, ${userName.trim()}, ${userEmail?.trim() || null}, ${rating}, ${comment?.trim() || null}, ${reviewStatus})
      RETURNING *
    `
    
    return NextResponse.json({
      review: {
        id: result[0].id,
        productId: result[0].product_id,
        userId: result[0].user_id,
        userName: result[0].user_name,
        userEmail: result[0].user_email,
        rating: result[0].rating,
        comment: result[0].comment,
        status: result[0].status,
        createdAt: result[0].created_at,
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating review:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create review" },
      { status: 500 }
    )
  }
}

