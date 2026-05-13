import { sql } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Metadata } from "next"
import Image from "next/image"
import { format } from "date-fns"
import dynamicImport from "next/dynamic"
import { HeroSectionV2 } from "@/components/home/HeroSectionV2"

const ScrollableProducts = dynamicImport(
  () => import("@/components/product/scrollable-products").then((mod) => ({ default: mod.ScrollableProducts })),
  { ssr: false }
)

// Force dynamic rendering to show latest products
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Premium Luxury Fashion & Home Essentials | Zarge",
  description: "Discover premium luxury fashion and home essentials at Zarge. Shop elegant formal wear, semi-formal apparel for men and women, plus exclusive home textiles including premium bedsheets, quilts, blankets, and pillow covers. Pakistani craftsmanship meets modern luxury.",
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
    title: "Premium Luxury Fashion & Home Essentials | Zarge",
    description: "Discover premium luxury fashion and home essentials at Zarge. Shop elegant formal wear, semi-formal apparel for men and women, plus exclusive home textiles.",
    type: "website",
    images: [
      {
        url: "/img/ICON WHT LOGO TRANSPARANT.png",
        width: 1200,
        height: 630,
        alt: "Zarge - Premium Luxury Fashion & Home Essentials",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Luxury Fashion & Home Essentials | Zarge",
    description: "Discover premium luxury fashion and home essentials at Zarge. Shop elegant formal wear, semi-formal apparel for men and women.",
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
    <div className="relative min-h-screen">

      {/* Global background image */}
      <div className="aboslute inset-0 z-0">
        <Image
          src="/img/Background.jpeg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* All content above the background */}
      <div className="relative z-10">

      {/* Hero Section */}
      <HeroSectionV2 />

      
      {/* Collections Section */}
        <section className="py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">

          {/* Collection 1 - Unspoken Resilience */}
          <div className="relative group overflow-hidden min-h-[500px] md:min-h-[600px]">
            {/* Background Image */}
            <Image
              src="/img/bloom.png"
              alt="Unspoken Resilience"
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end items-center text-center p-8 md:p-12">
              <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">Collection</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Unspoken Resilience
              </h2>
              <p className="text-sm md:text-base text-gray-300 mb-6 max-w-sm leading-relaxed">
                Some things are carried quietly. This collection is for those who
                endure without needing to announce it — strength stitched into
                every thread.
              </p>
              <Link
                href="/collections/unspoken-resilience"
                className="inline-flex items-center justify-center w-fit bg-white text-black px-6 py-3 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                View Collection
              </Link>
            </div>
          </div>

          {/* Collection 2 - Still Becoming */}
          <div className="relative group overflow-hidden min-h-[500px] md:min-h-[600px]">
            {/* Background Image */}
            <Image
              src="/img/SilentBloom.png"
              alt="Still Becoming"
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end items-center text-center p-8 md:p-12">
              <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">Collection</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Still Becoming
              </h2>
              <p className="text-sm md:text-base text-gray-300 mb-6 max-w-sm leading-relaxed">
                Growth is not a moment — it&apos;s a process. Pieces designed for those
                still finding their shape, still rising, still unfolding into who
                they are meant to be.
              </p>
              <Link
                href="/collections/still-becoming"
                className="inline-flex items-center justify-center w-fit bg-white text-black px-6 py-3 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                View Collection
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Category Sections */}
      {/* <section className="py-16 px-4 bg-[#121213]">
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
      </section> */}

      {/* Latest Blog Posts Section */}
      {/* {latestPosts.length > 0 && (
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
                      <span>{post.author_name || "Zarge"}</span>
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
      )} */}

      {/* Additional Sections */}
      <section className="py-16 px-4 pb-0">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-serif font-bold mb-4">Why Choose Zarge?</h2>
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
    </div>
  )
}
