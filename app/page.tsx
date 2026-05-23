import { sql } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Metadata } from "next"
import Image from "next/image"
import { format } from "date-fns"
import dynamicImport from "next/dynamic"
import { HeroSectionV2 } from "@/components/home/HeroSectionV2"
import { OurStory } from "@/components/OurStory"

const ScrollableProducts = dynamicImport(
  () => import("@/components/product/scrollable-products").then((mod) => ({ default: mod.ScrollableProducts })),
  { ssr: false }
)

// Force dynamic rendering to show latest products
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Zarge",
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
      <div className="fixed inset-0 z-0">
        <Image
          src="/img/Background.jpeg"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center"
          priority
        />
      </div>

      {/* All content above the background */}
      <div className="relative z-10">

      {/* Hero Section */}
      <HeroSectionV2 />

      
      {/* Collections Section */}
        <section data-theme="dark" className="py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">

          {/* Collection 1 - Unspoken Resilience */}
          <div className="relative group overflow-hidden min-h-[500px] md:min-h-[600px]">
            {/* Background Image */}
            <Image
              src="/img/Sword.png"
              alt="Unspoken Resilience"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end items-center text-center p-8 md:p-12">
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-gray-400 mb-3">Collection</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                Unspoken Resilience
              </h2>
              <p className="font-sans text-sm text-gray-300 mb-8 max-w-sm leading-7 font-light">
                Some things are carried quietly. This collection is for those who
                endure without needing to announce it — strength stitched into
                every thread.
              </p>
              <Link
                href="/collections/unspoken-resilience"
                className="font-sans inline-flex items-center justify-center border border-[#B8960C] text-[#B8960C] px-6 py-3 text-sm tracking-widest uppercase bg-black/60 hover:bg-[#B8960C] hover:text-white transition-all duration-300"
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
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end items-center text-center p-8 md:p-12">
              <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">Collection</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                Still Becoming
              </h2>
              <p className="text-sm md:text-base text-gray-300 mb-6 max-w-sm leading-relaxed">
                Growth is not a moment — it&apos;s a process. Pieces designed for those
                still finding their shape, still rising, still unfolding into who
                they are meant to be.
              </p>
              <Link
                href="/collections/still-becoming"
                className="inline-flex items-center justify-center w-fit border border-[#B8960C] text-[#B8960C] px-6 py-3 text-sm tracking-widest uppercase bg-black/60 hover:bg-[#B8960C] hover:text-white transition-all duration-300"
              >
                View Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story- Zarge */}
      {/* <div data-theme="dark"> */}
      <OurStory />
      {/* </div> */}

      </div>
    </div>
  )
}
