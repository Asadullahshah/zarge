import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'

    // Get Women category and all its subcategories
    let womenCategory: any[] = []
    let womenId: string | null = null

    try {
      womenCategory = await sql`
        SELECT id FROM categories WHERE slug = 'women' LIMIT 1
      `
      
      if (womenCategory.length === 0) {
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
          headers: { 'Content-Type': 'application/xml' },
        })
      }

      womenId = womenCategory[0].id
    } catch (err) {
      console.error('Error fetching women category:', err)
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
        headers: { 'Content-Type': 'application/xml' },
      })
    }

    // Get all subcategories
    let subcategories: any[] = []
    try {
      subcategories = await sql`
        SELECT slug, updated_at, created_at FROM categories 
        WHERE parent_id = ${womenId}
        ORDER BY slug
      `
    } catch (err) {
      console.error('Error fetching women subcategories:', err)
    }

    // Get all products in women's category and subcategories
    let products: any[] = []
    try {
      products = await sql`
        SELECT p.slug, p.updated_at, p.created_at
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE p.status = 'PUBLISHED' 
          AND pc.category_id IN (
            SELECT id FROM categories WHERE id = ${womenId} OR parent_id = ${womenId}
          )
        ORDER BY p.updated_at DESC
      `
    } catch (err) {
      console.error('Error fetching women products:', err)
    }

    const urls: string[] = []

    // Add main women's category page
    urls.push(`  <url>
    <loc>${baseUrl}/women</loc>
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
  <!-- Women's Collection: Premium women's clothing, luxury fashion, formal wear, stitched and unstitched collections -->
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
    console.error('Error generating women sitemap:', error)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/women</loc>
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
