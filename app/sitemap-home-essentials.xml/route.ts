import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'

    // Get Home Essentials category and all its subcategories
    let homeCategory: any[] = []
    let homeId: string | null = null

    try {
      homeCategory = await sql`
        SELECT id FROM categories WHERE slug = 'home-essentials' LIMIT 1
      `
      
      if (homeCategory.length === 0) {
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
          headers: { 'Content-Type': 'application/xml' },
        })
      }

      homeId = homeCategory[0].id
    } catch (err) {
      console.error('Error fetching home essentials category:', err)
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
        headers: { 'Content-Type': 'application/xml' },
      })
    }

    // Get all subcategories
    let subcategories: any[] = []
    try {
      subcategories = await sql`
        SELECT slug, updated_at, created_at FROM categories 
        WHERE parent_id = ${homeId}
        ORDER BY slug
      `
    } catch (err) {
      console.error('Error fetching home essentials subcategories:', err)
    }

    // Get all products in home essentials category and subcategories
    let products: any[] = []
    try {
      products = await sql`
        SELECT p.slug, p.updated_at, p.created_at
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE p.status = 'PUBLISHED' 
          AND pc.category_id IN (
            SELECT id FROM categories WHERE id = ${homeId} OR parent_id = ${homeId}
          )
        ORDER BY p.updated_at DESC
      `
    } catch (err) {
      console.error('Error fetching home essentials products:', err)
    }

    const urls: string[] = []

    // Add main home essentials category page
    urls.push(`  <url>
    <loc>${baseUrl}/home-essentials</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`)

    // Add subcategory pages
    for (const subcat of subcategories) {
      const lastMod = subcat.updated_at ? new Date(subcat.updated_at).toISOString() : (subcat.created_at ? new Date(subcat.created_at).toISOString() : new Date().toISOString())
      urls.push(`  <url>
    <loc>${baseUrl}/category/${subcat.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
    }

    // Add product pages
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
  <!-- Home Essentials: Premium home textiles, luxury bedsheets, quilts, blankets, pillow covers, towels, curtains -->
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
    console.error('Error generating home essentials sitemap:', error)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/home-essentials</loc>
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
