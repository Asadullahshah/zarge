import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'

    // Get all published blog posts
    let blogPosts: any[] = []
    try {
      blogPosts = await sql`
        SELECT slug, updated_at, created_at, published_at
        FROM blog_posts
        WHERE status = 'PUBLISHED'
        ORDER BY updated_at DESC
      `
    } catch (err) {
      console.error('Error fetching blog posts:', err)
    }

    const urls: string[] = []

    // Add main blog page
    urls.push(`  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`)

    // Add blog post pages
    for (const post of blogPosts) {
      const lastMod = post.updated_at ? new Date(post.updated_at).toISOString() : (post.published_at ? new Date(post.published_at).toISOString() : (post.created_at ? new Date(post.created_at).toISOString() : new Date().toISOString()))
      urls.push(`  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Blog: Fashion tips, style guides, trend articles, and lifestyle content -->
${urls.join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error: any) {
    console.error('Error generating blog sitemap:', error)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`, {
      headers: { 'Content-Type': 'application/xml' },
      status: 200,
    })
  }
}
