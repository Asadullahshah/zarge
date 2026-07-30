import { sql } from "@/lib/db"
import Link from "next/link"
import { Metadata } from "next"
import Image from "next/image"
import { RotateCcw, Truck } from "lucide-react"
import { HeroSectionV2 } from "@/components/home/HeroSectionV2"
import { OurStory } from "@/components/OurStory"

// Force dynamic rendering to show latest products
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Wearable narratives stitched through embroidery | Zarge",
  description: "Zargé is embroidered essentials, not fast fashion. Oversized silhouettes in premium French Cotton Terry, where every stitch carries a story worn, not told.",
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
    title: "Wearable narratives stitched through embroidery | Zarge",
    description: "Zargé is embroidered essentials, not fast fashion. Oversized silhouettes in premium French Cotton Terry, where every stitch carries a story worn, not told.",
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
    title: "Wearable narratives stitched through embroidery | Zarge",
    description: "Zargé is embroidered essentials, not fast fashion. Oversized silhouettes in premium French Cotton Terry, where every stitch carries a story worn, not told.",
  },
}

const CATEGORY_FALLBACK_IMAGE = "/img/silentbloom.png"

export default async function HomePage() {
  // ── Products for the hero carousel (with device-specific "home" images) ──
  const heroProductsRaw = await sql`
    SELECT
      p.id, p.name, p.slug, p.short_desc, p.description,
      json_agg(
        jsonb_build_object(
          'url', pi.url,
          'isPrimary', pi.is_primary,
          'isHomeMobile', pi.is_home_mobile,
          'isHomeDesktop', pi.is_home_desktop,
          'order', pi."order"
        ) ORDER BY pi."order"
      ) FILTER (WHERE pi.id IS NOT NULL) as images
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.status = 'PUBLISHED'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `

  const heroSlides = heroProductsRaw
    .map((p: any) => {
      const imgs: any[] = p.images || []
      const desktop = imgs.find((i) => i.isHomeDesktop) || imgs.find((i) => i.isPrimary) || imgs[0]
      const mobile = imgs.find((i) => i.isHomeMobile) || imgs.find((i) => i.isPrimary) || imgs[0]
      const desktopUrl = desktop?.url || mobile?.url
      const mobileUrl = mobile?.url || desktop?.url
      if (!desktopUrl) return null
      return {
        id: p.id,
        image: desktopUrl,
        imageMobile: mobileUrl,
        name: p.name,
        description: p.short_desc || p.description || "",
        slug: p.slug,
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)

  // ── Top-level categories for the collections section ──
  const homeCategories = await sql`
    SELECT id, name, slug, description, image, image_desktop, image_mobile
    FROM categories
    WHERE parent_id IS NULL
    ORDER BY name
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
      <HeroSectionV2 slides={heroSlides} />

      
      {/* Collections Section */}
        <section data-theme="dark" className="py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[620px] md:min-h-[820px]">

          {homeCategories.map((category: any) => {
            const desktopSrc = category.image_desktop || category.image || CATEGORY_FALLBACK_IMAGE
            const mobileSrc = category.image_mobile || category.image_desktop || category.image || CATEGORY_FALLBACK_IMAGE
            return (
            <div key={category.id} className="relative group overflow-hidden min-h-[620px] md:min-h-[820px]">
              {/* Background Image — device-specific */}
              <Image
                src={desktopSrc}
                alt={category.name}
                fill
                sizes="50vw"
                className="hidden md:block object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <Image
                src={mobileSrc}
                alt={category.name}
                fill
                sizes="100vw"
                className="md:hidden object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end items-center text-center p-8 md:p-12">
                <p className="font-sans text-xs uppercase tracking-[0.3em] text-gray-400 mb-3">Collection</p>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="font-sans text-sm text-gray-300 mb-8 max-w-sm leading-7 font-light">
                    {category.description}
                  </p>
                )}
                <Link
                  href={`/collections/${category.slug}`}
                  className="font-sans inline-flex items-center justify-center border border-[#B8960C] text-[#B8960C] px-6 py-3 text-sm tracking-widest uppercase bg-black/60 hover:bg-[#B8960C] hover:text-white transition-all duration-300"
                >
                  View Collection
                </Link>
              </div>
            </div>
            )
          })}
        </div>
      </section>

      {/* Our Story- Zarge */}
      {/* <div data-theme="dark"> */}
      <OurStory />
      {/* </div> */}

      {/* Policies */}
      <section data-theme="light" className="border-t border-black/10 py-16 md:py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 sm:grid-cols-2">
          <Link
            href="/exchange-policy"
            className="group flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1"
          >
            <RotateCcw className="mb-4 h-10 w-10 text-[#1a1a1a] group-hover:text-[#B8960C] transition-colors" strokeWidth={2.25} />
            <span className="font-sans text-sm font-bold uppercase tracking-[0.25em] text-[#1a1a1a] group-hover:text-[#B8960C] transition-colors">
              Return &amp; Exchange Policy
            </span>
          </Link>
          <Link
            href="/shipping-policy"
            className="group flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1"
          >
            <Truck className="mb-4 h-10 w-10 text-[#1a1a1a] group-hover:text-[#B8960C] transition-colors" strokeWidth={2.25} />
            <span className="font-sans text-sm font-bold uppercase tracking-[0.25em] text-[#1a1a1a] group-hover:text-[#B8960C] transition-colors">
              Shipping Policy
            </span>
          </Link>
        </div>
      </section>

      </div>
    </div>
  )
}
