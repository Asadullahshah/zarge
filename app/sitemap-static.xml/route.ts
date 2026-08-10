import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.zargeofficial.com'
    const now = new Date().toISOString()

    const staticPages = [
      { url: baseUrl, priority: '1.0', changefreq: 'daily' },
      { url: `${baseUrl}/collections/unspoken-resilience`, priority: '0.9', changefreq: 'daily' },
      { url: `${baseUrl}/collections/still-becoming`, priority: '0.9', changefreq: 'daily' },
      { url: `${baseUrl}/sale`, priority: '0.9', changefreq: 'daily' },
      { url: `${baseUrl}/products`, priority: '0.8', changefreq: 'daily' },
      { url: `${baseUrl}/blog`, priority: '0.8', changefreq: 'daily' },
      { url: `${baseUrl}/about`, priority: '0.6', changefreq: 'monthly' },
      { url: `${baseUrl}/contact`, priority: '0.5', changefreq: 'monthly' },
      { url: `${baseUrl}/privacy-policy`, priority: '0.3', changefreq: 'yearly' },
      { url: `${baseUrl}/terms`, priority: '0.3', changefreq: 'yearly' },
      { url: `${baseUrl}/exchange-policy`, priority: '0.3', changefreq: 'yearly' },
      { url: `${baseUrl}/shipping-policy`, priority: '0.3', changefreq: 'yearly' },
    ]

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error: any) {
    console.error('Error generating static sitemap:', error)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.zargeofficial.com'
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
    
    return new NextResponse(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
      status: 200,
    })
  }
}

