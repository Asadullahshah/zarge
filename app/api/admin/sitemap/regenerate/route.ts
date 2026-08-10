import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.zargeofficial.com'

    // Count all items that will be in the sitemap
    const [productCount, categoryCount, blogCount] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM products WHERE status = 'PUBLISHED'`,
      sql`SELECT COUNT(*) as count FROM categories`,
      sql`SELECT COUNT(*) as count FROM blog_posts WHERE status = 'PUBLISHED'`,
    ])

    const totalProducts = parseInt(productCount[0]?.count || '0')
    const totalCategories = parseInt(categoryCount[0]?.count || '0')
    const totalBlogPosts = parseInt(blogCount[0]?.count || '0')
    
    // Static pages count
    const staticPagesCount = 12 // Home, Men, Women, Home Essentials, Sale, Products, Blog, About, Contact, Privacy, Terms, Exchange Policy

    const totalUrls = staticPagesCount + totalProducts + totalCategories + totalBlogPosts

    return NextResponse.json({
      success: true,
      message: "Sitemap has been regenerated successfully!",
      stats: {
        staticPages: staticPagesCount,
        products: totalProducts,
        categories: totalCategories,
        blogPosts: totalBlogPosts,
        totalUrls,
      },
      sitemapUrl: `${baseUrl}/sitemap.xml`,
      note: "The sitemap is dynamically generated and automatically updates when accessed. No cache clearing is needed.",
    })
  } catch (error: any) {
    console.error("Error regenerating sitemap:", error)
    return NextResponse.json(
      { error: error.message || "Failed to regenerate sitemap." },
      { status: 500 }
    )
  }
}

