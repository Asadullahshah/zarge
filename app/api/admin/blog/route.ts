import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"
import { slugify } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = sql`
      SELECT 
        bp.*,
        u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
    `

    if (status) {
      query = sql`
        SELECT 
          bp.*,
          u.name as author_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.status = ${status}
      `
    }

    const posts = await sql`
      ${query}
      ORDER BY bp.created_at DESC
    `

    return NextResponse.json({ posts })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch posts" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      status,
      isHubPost,
      hubTopic,
      seoTitle,
      seoDesc,
      seoKeywords,
      canonicalUrl,
      categoryIds,
      relatedPostIds,
      publishedAt,
    } = body

    const postSlug = slug || slugify(title)

    // Check if slug exists
    const existing = await sql`
      SELECT id FROM blog_posts WHERE slug = ${postSlug}
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Post with this slug already exists" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO blog_posts (
        title, slug, excerpt, content, featured_image, status,
        is_hub_post, hub_topic, seo_title, seo_desc, seo_keywords,
        canonical_url, author_id, published_at, related_posts
      ) VALUES (
        ${title}, ${postSlug}, ${excerpt || null}, ${content},
        ${featuredImage || null}, ${status || "DRAFT"},
        ${isHubPost || false}, ${hubTopic || null},
        ${seoTitle || null}, ${seoDesc || null},
        ${seoKeywords && seoKeywords.length > 0 ? JSON.stringify(seoKeywords) : null}::TEXT[],
        ${canonicalUrl || null}, ${session.user.id},
        ${publishedAt || null},
        ${relatedPostIds && relatedPostIds.length > 0 ? JSON.stringify(relatedPostIds) : null}::UUID[]
      ) RETURNING *
    `

    const post = result[0]

    // Link categories
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await sql`
          INSERT INTO blog_post_categories (post_id, category_id)
          VALUES (${post.id}, ${categoryId})
          ON CONFLICT DO NOTHING
        `
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    )
  }
}

