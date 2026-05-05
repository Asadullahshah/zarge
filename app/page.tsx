import { sql } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Metadata } from "next"
import Image from "next/image"
import { format } from "date-fns"
import dynamicImport from "next/dynamic"
import { HeroSection } from "@/components/home/hero-section"

const ScrollableProducts = dynamicImport(
  () => import("@/components/product/scrollable-products").then((mod) => ({ default: mod.ScrollableProducts })),
  { ssr: false }
)

// Force dynamic rendering to show latest products
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Premium Luxury Fashion & Home Essentials | House of Noire",
  description: "Discover premium luxury fashion and home essentials at House of Noire. Shop elegant formal wear, semi-formal apparel for men and women, plus exclusive home textiles including premium bedsheets, quilts, blankets, and pillow covers. Pakistani craftsmanship meets modern luxury.",
  keywords: [
    "premium clothing",
    "luxury fashion",
    "home essentials",
    "premium fashion store",
    "formal wear",
    "semi-formal apparel",
    "luxury clothing",
    "premium home textiles",
    "designer fashion",
    "high-end clothing",
    "luxury bedsheets",
    "premium quilts",
    "home essentials online",
    "premium fashion Pakistan",
    "luxury home decor"
  ],
  openGraph: {
    title: "Premium Luxury Fashion & Home Essentials | House of Noire",
    description: "Discover premium luxury fashion and home essentials at House of Noire. Shop elegant formal wear, semi-formal apparel for men and women, plus exclusive home textiles.",
    type: "website",
    images: [
      {
        url: "/img/ICON WHT LOGO TRANSPARANT.png",
        width: 1200,
        height: 630,
        alt: "House of Noire - Premium Luxury Fashion & Home Essentials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Luxury Fashion & Home Essentials | House of Noire",
    description: "Discover premium luxury fashion and home essentials at House of Noire. Shop elegant formal wear, semi-formal apparel for men and women.",
  },
}

export default async function HomePage() {
  // Get featured products (or fallback to recent products if none are featured)
  let featuredProducts = await sql`
    SELECT 
      p.*,
      json_agg(
        DISTINCT jsonb_build_object(
          'url', pi.url,
          'alt', pi.alt,
          'isPrimary', pi.is_primary,
          'order', pi."order"
        )
      ) FILTER (WHERE pi.id IS NOT NULL) as images
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE COALESCE(p.featured, false) IS TRUE AND p.status = 'PUBLISHED'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 12
  `

  // If no featured products, show recent products as fallback
  if (featuredProducts.length === 0) {
    featuredProducts = await sql`
      SELECT 
        p.*,
        json_agg(
          DISTINCT jsonb_build_object(
            'url', pi.url,
            'alt', pi.alt,
            'isPrimary', pi.is_primary,
            'order', pi."order"
          )
        ) FILTER (WHERE pi.id IS NOT NULL) as images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.status = 'PUBLISHED'
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 12
    `
  }

  // Get category counts (including products from subcategories)
  const categoryStats = await sql`
    SELECT 
      parent.name,
      parent.slug,
      COUNT(DISTINCT p.id) as product_count
    FROM categories parent
    LEFT JOIN categories child ON child.parent_id = parent.id
    LEFT JOIN product_categories pc ON (pc.category_id = parent.id OR pc.category_id = child.id)
    LEFT JOIN products p ON pc.product_id = p.id AND p.status = 'PUBLISHED'
    WHERE parent.parent_id IS NULL
    GROUP BY parent.id, parent.name, parent.slug
    ORDER BY parent.name
  `

  // Get latest blog posts
  const latestPosts = await sql`
    SELECT 
      bp.*,
      u.name as author_name
    FROM blog_posts bp
    LEFT JOIN users u ON bp.author_id = u.id
    WHERE bp.status = 'PUBLISHED'
    ORDER BY bp.published_at DESC
    LIMIT 3
  `

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-b from-[#121213] to-[#0B0B0C]">
          <div className="container mx-auto">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-12 bg-primary"></div>
                <h2 className="text-3xl md:text-5xl font-serif font-bold">Featured Products</h2>
              </div>
              <p className="text-base md:text-lg text-[#BDBDBD] ml-4 mb-4">Handpicked selections from our premium collection</p>
              <Link href="/products?featured=true" className="inline-block ml-4">
                <Button variant="outline" size="lg" className="text-base px-6 py-3">
                  View All Featured
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <ScrollableProducts products={featuredProducts} />
          </div>
        </section>
      )}

      {/* Category Sections */}
      <section className="py-16 px-4 bg-[#121213]">
        <div className="container mx-auto">
          <h2 className="text-4xl font-serif font-bold mb-8 text-center">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categoryStats.map((category: any) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group bg-[#0B0B0C] rounded-lg p-8 border border-[#1A1A1B] hover:border-primary transition-all hover:shadow-xl"
              >
                <h3 className="text-2xl font-serif font-bold mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-[#BDBDBD] mb-4">
                  {category.product_count || 0} products available
                </p>
                <div className="flex items-center text-primary group-hover:gap-2 transition-all">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts Section */}
      {latestPosts.length > 0 && (
        <section className="py-16 px-4 bg-[#121213]">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-10 bg-primary"></div>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold">Latest from Our Blog</h2>
                </div>
                <p className="text-sm md:text-base text-[#BDBDBD] ml-4">Fashion tips, style guides, and insights</p>
              </div>
              <Link href="/blog" className="w-full md:w-auto">
                <Button variant="outline" className="w-full md:w-auto justify-center">
                  View All Posts
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPosts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-[#0B0B0C] rounded-lg overflow-hidden border border-[#1A1A1B] hover:border-primary transition-all hover:shadow-xl"
                >
                  {post.featured_image && (
                    <div className="aspect-video relative overflow-hidden bg-[#0B0B0C]">
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      {post.is_hub_post && (
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 bg-primary/90 text-primary-foreground rounded-full text-xs font-semibold">
                            Hub Post
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-[#BDBDBD] mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-[#BDBDBD]">
                      <span>{post.author_name || "House of Noire"}</span>
                      {post.published_at && (
                        <span>{format(new Date(post.published_at), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Additional Sections */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-serif font-bold mb-4">Why Choose House of Noire?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-[#BDBDBD]">
                Best quality products with handpicked premium fabrics and materials
              </p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Pakistani Craftsmanship</h3>
              <p className="text-[#BDBDBD]">
                Authentic Pakistani designs and traditional craftsmanship
              </p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-[#BDBDBD]">
                Quick and reliable shipping across Pakistan
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
