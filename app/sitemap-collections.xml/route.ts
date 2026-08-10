import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// The two t-shirt drop collections the store is built around
const COLLECTIONS = ['unspoken-resilience', 'still-becoming']

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.zargeofficial.com'

  try {
    // All published products (drops currently have no subcategories)
    let products: any[] = []
    try {
      products = await sql`
        SELECT slug, updated_at, created_at
        FROM products
        WHERE status = 'PUBLISHED'
        ORDER BY updated_at DESC
      `
    } catch (err) {
      console.error('Error fetching products for collections sitemap:', err)
    }

    const urls: string[] = []

    // Collection landing pages
    for (const slug of COLLECTIONS) {
      urls.push(`  <url>
    <loc>${baseUrl}/collections/${slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`)
    }

    // Product pages
    for (const product of products) {
      const lastMod = product.updated_at ? new Date(product.updated_at).toISOString() : (product.created_at ? new Date(product.created_at).toISOString() : new Date().toISOString())
      urls.push(`  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Zargé Collections: Unspoken Resilience & Still Becoming drops and all products -->
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
    console.error('Error generating collections sitemap:', error)
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/collections/unspoken-resilience</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/collections/still-becoming</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`, {
      headers: { 'Content-Type': 'application/xml' },
      status: 200,
    })
  }
}
