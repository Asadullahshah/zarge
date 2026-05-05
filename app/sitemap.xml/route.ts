import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'
    const now = new Date().toISOString()
    
    // Get last modified dates for each category sitemap with simplified error handling
    let menLastMod = now
    let womenLastMod = now
    let homeLastMod = now
    let blogLastMod = now

    try {
      // Simplified queries - get max updated_at with simpler logic
      const menResult = await sql`
        SELECT MAX(p.updated_at) as last_modified
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        INNER JOIN categories c ON pc.category_id = c.id
        WHERE p.status = 'PUBLISHED' 
          AND (c.slug = 'men' OR c.parent_id = (SELECT id FROM categories WHERE slug = 'men' LIMIT 1))
        LIMIT 1
      `
      if (menResult && menResult[0]?.last_modified) {
        menLastMod = new Date(menResult[0].last_modified).toISOString()
      }
    } catch (err) {
      console.error('Error fetching men sitemap date:', err)
    }

    try {
      const womenResult = await sql`
        SELECT MAX(p.updated_at) as last_modified
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        INNER JOIN categories c ON pc.category_id = c.id
        WHERE p.status = 'PUBLISHED' 
          AND (c.slug = 'women' OR c.parent_id = (SELECT id FROM categories WHERE slug = 'women' LIMIT 1))
        LIMIT 1
      `
      if (womenResult && womenResult[0]?.last_modified) {
        womenLastMod = new Date(womenResult[0].last_modified).toISOString()
      }
    } catch (err) {
      console.error('Error fetching women sitemap date:', err)
    }

    try {
      const homeResult = await sql`
        SELECT MAX(p.updated_at) as last_modified
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        INNER JOIN categories c ON pc.category_id = c.id
        WHERE p.status = 'PUBLISHED' 
          AND (c.slug = 'home-essentials' OR c.parent_id = (SELECT id FROM categories WHERE slug = 'home-essentials' LIMIT 1))
        LIMIT 1
      `
      if (homeResult && homeResult[0]?.last_modified) {
        homeLastMod = new Date(homeResult[0].last_modified).toISOString()
      }
    } catch (err) {
      console.error('Error fetching home essentials sitemap date:', err)
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
  
  <!-- Men's Collection Sitemap: All men's products and subcategories -->
  <sitemap>
    <loc>${baseUrl}/sitemap-men.xml</loc>
    <lastmod>${menLastMod}</lastmod>
  </sitemap>
  
  <!-- Women's Collection Sitemap: All women's products and subcategories -->
  <sitemap>
    <loc>${baseUrl}/sitemap-women.xml</loc>
    <lastmod>${womenLastMod}</lastmod>
  </sitemap>
  
  <!-- Home Essentials Sitemap: All home essentials products and subcategories -->
  <sitemap>
    <loc>${baseUrl}/sitemap-home-essentials.xml</loc>
    <lastmod>${homeLastMod}</lastmod>
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
