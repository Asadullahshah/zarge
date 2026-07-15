import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'
    const now = new Date().toISOString()
    
    // Get last modified dates for each sitemap with simplified error handling
    let collectionsLastMod = now
    let blogLastMod = now

    try {
      const collectionsResult = await sql`
        SELECT MAX(updated_at) as last_modified
        FROM products
        WHERE status = 'PUBLISHED'
        LIMIT 1
      `
      if (collectionsResult && collectionsResult[0]?.last_modified) {
        collectionsLastMod = new Date(collectionsResult[0].last_modified).toISOString()
      }
    } catch (err) {
      console.error('Error fetching collections sitemap date:', err)
    }

    try {
      const blogResult = await sql`
        SELECT MAX(updated_at) as last_modified
        FROM blog_posts
        WHERE status = 'PUBLISHED'
        LIMIT 1
      `
      if (blogResult && blogResult[0]?.last_modified) {
        blogLastMod = new Date(blogResult[0].last_modified).toISOString()
      }
    } catch (err) {
      console.error('Error fetching blog sitemap date:', err)
    }

    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Sitemap: Contains static pages and all category pages -->
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  
  <!-- Collections Sitemap: Drop collection pages and all products -->
  <sitemap>
    <loc>${baseUrl}/sitemap-collections.xml</loc>
    <lastmod>${collectionsLastMod}</lastmod>
  </sitemap>

  <!-- Blog Sitemap: All published blog posts -->
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${blogLastMod}</lastmod>
  </sitemap>
</sitemapindex>`

    return new NextResponse(sitemapIndex, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error: any) {
    console.error('Error generating sitemap index:', error)
    // Return a minimal sitemap index on error
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-static.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`
    
    return new NextResponse(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
      status: 200,
    })
  }
}
