import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/schemas"
import { AddToCartButton } from "./add-to-cart-button"
import { formatPrice } from "@/lib/utils"
import { ColorImageProvider } from "./color-image-provider"
import { ReviewsSection } from "./reviews-section"
import dynamic from "next/dynamic"

const ScrollableProducts = dynamic(
  () => import("@/components/product/scrollable-products").then((mod) => ({ default: mod.ScrollableProducts })),
  { ssr: false }
)

// Revalidate product pages every 5 seconds to show updated stock
export const revalidate = 5

async function getProduct(slug: string) {
  try {
    const product = await sql`
      SELECT * FROM products WHERE slug = ${slug} AND status = 'PUBLISHED'
    `

    if (product.length === 0) {
      return null
    }

    const [productData] = product

    const [images, variants, categories] = await Promise.all([
      sql`
        SELECT id, url, alt, "order", width, height, is_primary, color
        FROM product_images
        WHERE product_id = ${productData.id}
        ORDER BY "order" ASC
      `,
      sql`
        SELECT * FROM variants
        WHERE product_id = ${productData.id}
        ORDER BY created_at ASC
      `,
      sql`
        SELECT c.* FROM categories c
        INNER JOIN product_categories pc ON c.id = pc.category_id
        WHERE pc.product_id = ${productData.id}
      `,
    ])

    return {
      ...productData,
      images: images as any[],
      variants: variants as any[],
      categories: categories as any[],
    } as any
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

async function getSimilarProducts(
  productId: string, 
  categoryIds: string[], 
  productGender?: string,
  productType?: string,
  limit: number = 8
) {
  try {
    let similarProducts: any[] = []

    if (categoryIds.length === 0) {
      console.log(`[SIMILAR PRODUCTS] No category IDs provided for product ${productId}`)
      return []
    }

    // Get all categories info to prioritize subcategories
    // Query each category individually if array syntax doesn't work
    let allCategoriesInfo: any[] = []
    for (const catId of categoryIds) {
      const catInfo = await sql`
        SELECT id, parent_id, name FROM categories WHERE id = ${catId}
      `
      if (catInfo.length > 0) {
        allCategoriesInfo.push(catInfo[0])
      }
    }
    
    if (allCategoriesInfo.length === 0) {
      console.log(`[SIMILAR PRODUCTS] No categories found for IDs: ${categoryIds.join(', ')}`)
      return []
    }
    
    // Prioritize subcategories (categories with parent_id) over parent categories
    const subcategory = allCategoriesInfo.find((cat: any) => cat.parent_id)
    const category = subcategory || allCategoriesInfo[0]
    
    console.log(`[SIMILAR PRODUCTS] All categories for product:`, allCategoriesInfo.map((c: any) => `${c.name} (${c.id}, parent: ${c.parent_id})`))
    console.log(`[SIMILAR PRODUCTS] Selected category: ${category.name} (ID: ${category.id}, Parent: ${category.parent_id})`)
    const primaryCategoryId = category.id
    
    // Strategy 1: If it's a subcategory, try to find products in the same subcategory first
    if (category.parent_id) {
      console.log(`[SIMILAR PRODUCTS] Category is a subcategory, searching in subcategory first...`)
      console.log(`[SIMILAR PRODUCTS] Querying for products in category ${primaryCategoryId}, excluding product ${productId}`)
      
      // It's a subcategory - search for products in the same subcategory
      const subcategoryResults = await sql`
        SELECT
          p.id,
          p.name,
          p.slug,
          p.price,
          p.sale_price,
          p.short_desc,
          p.available_colors,
          p.stock,
          p.created_at,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::json
          ) as images
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE p.id != ${productId}
          AND p.status = 'PUBLISHED'
          AND pc.category_id = ${primaryCategoryId}
        GROUP BY p.id, p.created_at
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `
      
      similarProducts = subcategoryResults as any[]
      console.log(`[SIMILAR PRODUCTS] Found ${similarProducts.length} products in subcategory ${category.name}`)
      
      // Debug: Also check how many products are in this category total (including current product)
      const totalInCategory = await sql`
        SELECT COUNT(DISTINCT p.id) as count
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE p.status = 'PUBLISHED' AND pc.category_id = ${primaryCategoryId}
      `
      console.log(`[SIMILAR PRODUCTS] Total products in category ${category.name}: ${totalInCategory[0]?.count || 0}`)
      
      // Strategy 2: If no results from subcategory, try main category (parent) including all its subcategories
      if (similarProducts.length === 0) {
        console.log(`[SIMILAR PRODUCTS] No products in subcategory, searching in parent category...`)
        const parentResults = await sql`
          SELECT
            p.id,
            p.name,
            p.slug,
            p.price,
            p.sale_price,
            p.short_desc,
            p.available_colors,
            p.stock,
            p.created_at,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'url', pi.url,
                  'alt', pi.alt,
                  'isPrimary', pi.is_primary,
                  'order', pi."order",
                  'color', pi.color
                )
              ) FILTER (WHERE pi.id IS NOT NULL),
              '[]'::json
            ) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          WHERE p.id != ${productId}
            AND p.status = 'PUBLISHED'
            AND pc.category_id IN (
              SELECT id FROM categories WHERE id = ${category.parent_id} OR parent_id = ${category.parent_id}
            )
          GROUP BY p.id, p.created_at
          ORDER BY p.created_at DESC
          LIMIT ${limit}
        `
        
        similarProducts = parentResults as any[]
        console.log(`[SIMILAR PRODUCTS] Found ${similarProducts.length} products in parent category`)
      }
    } else {
      console.log(`[SIMILAR PRODUCTS] Category is a parent category, searching in parent and subcategories...`)
      // It's a parent category - search for products in this main category including all subcategories
      const parentCategoryResults = await sql`
        SELECT
          p.id,
          p.name,
          p.slug,
          p.price,
          p.sale_price,
          p.short_desc,
          p.available_colors,
          p.stock,
          p.created_at,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order",
                'color', pi.color
              )
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::json
          ) as images
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE p.id != ${productId}
          AND p.status = 'PUBLISHED'
          AND pc.category_id IN (
            SELECT id FROM categories WHERE id = ${primaryCategoryId} OR parent_id = ${primaryCategoryId}
          )
        GROUP BY p.id, p.created_at
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `
      
      similarProducts = parentCategoryResults as any[]
      console.log(`[SIMILAR PRODUCTS] Found ${similarProducts.length} products in parent category and subcategories`)
    }

    return similarProducts as any[]
  } catch (error) {
    console.error("[SIMILAR PRODUCTS] Error fetching similar products:", error)
    // Return empty array on error to prevent page crash
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const product = await getProduct(params.slug)

  if (!product) {
    return {}
  }

  const price = parseFloat(product.sale_price || product.price)
  const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0]

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.noirefit.com'
  const productUrl = `${baseUrl}/product/${product.slug}`
  const description = product.seo_desc || product.short_desc || product.description || `Shop ${product.name} at Zarge. Premium quality ${product.gender?.toLowerCase() || ''} clothing and fashion.`

  return {
    title: product.seo_title || `${product.name} | Premium Fashion | Zarge`,
    description: description.substring(0, 160),
    keywords: product.seo_keywords && product.seo_keywords.length > 0 
      ? product.seo_keywords 
      : [
          product.name,
          `premium ${product.gender?.toLowerCase() || ''} clothing`,
          "luxury fashion",
          "premium clothing",
          "Zarge",
          ...(product.categories?.map((cat: any) => cat.name) || [])
        ],
    openGraph: {
      title: product.name,
      description: description.substring(0, 200),
      images: primaryImage ? [
        {
          url: primaryImage.url,
          width: 1200,
          height: 630,
          alt: product.name,
        }
      ] : [],
      type: "website",
      url: productUrl,
      siteName: "Zarge",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: description.substring(0, 200),
      images: primaryImage ? [primaryImage.url] : [],
    },
    alternates: {
      canonical: product.canonical_url || productUrl,
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  try {
    const product = await getProduct(params.slug)
    
    // Revalidate this page every 10 seconds to show updated stock
    // This ensures stock updates are reflected quickly

    if (!product) {
      notFound()
    }

  const breadcrumbs = [
    { name: "Home", url: "/" },
    ...(product.categories?.[0] ? [{ name: product.categories[0].name, url: `/category/${product.categories[0].slug}` }] : []),
    { name: product.name, url: `/product/${product.slug}` },
  ]

  // Extract unique colors from images and combine with available_colors
  const imageColors: string[] = product.images
    ?.map((img: any) => img.color)
    .filter((color: string | null | undefined) => color && color.trim() !== '') as string[] || []
  
  const uniqueImageColors: string[] = Array.from(new Set(imageColors.map((c: string) => c.trim().toLowerCase())))
    .map((lowerColor: string) => {
      // Find original case from images
      const original = imageColors.find((c: string) => c.trim().toLowerCase() === lowerColor)
      return original?.trim() || lowerColor
    })

  const productAvailableColors = product.available_colors || []
  const allAvailableColors = Array.from(new Set([
    ...productAvailableColors,
    ...uniqueImageColors
  ]))

  const productData = {
    ...product,
    slug: product.slug,
    price: parseFloat(product.price),
    sale_price: product.sale_price ? parseFloat(product.sale_price) : undefined,
    available_sizes: product.available_sizes || [],
    available_colors: allAvailableColors,
    measurements: product.measurements || {},
    variants: product.variants || [], // Include variants for availability checking
  }

  // Get similar products from the same category (with error handling)
  let similarProducts: any[] = []
  try {
    const categoryIds = product.categories?.map((cat: any) => cat.id) || []
    console.log(`[SIMILAR PRODUCTS] Product: ${product.name}, Category IDs:`, categoryIds)
    
    similarProducts = await getSimilarProducts(
      product.id, 
      categoryIds, 
      product.gender,
      product.type,
      8
    )
    console.log(`[SIMILAR PRODUCTS] Raw query returned ${similarProducts.length} similar products for ${product.name}`)
    
    // Process similar products to calculate stock and filter sizes from variants
    if (similarProducts.length > 0) {
      try {
        const { processProductsWithVariants } = await import("@/lib/product-helpers")
        const processed = await processProductsWithVariants(similarProducts)
        console.log(`[SIMILAR PRODUCTS] After processing variants: ${processed.length} products`)
        similarProducts = processed
      } catch (error) {
        console.error("[SIMILAR PRODUCTS] Error processing variants:", error)
        // Continue with unprocessed products rather than losing them
        console.log(`[SIMILAR PRODUCTS] Continuing with ${similarProducts.length} unprocessed products`)
      }
    } else {
      console.log(`[SIMILAR PRODUCTS] No products found - product ID: ${product.id}, categoryIds:`, categoryIds)
    }
  } catch (error) {
    console.error("Error loading similar products:", error)
    // Continue without similar products if there's an error
  }

  // Get reviews stats for rating display
  let averageRating = 0
  let totalReviews = 0
  try {
    const ratingStats = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating)::numeric(3,2) as average_rating
      FROM reviews
      WHERE product_id = ${product.id} AND status = 'APPROVED'
    `
    if (ratingStats.length > 0 && ratingStats[0].total_reviews > 0) {
      averageRating = parseFloat(ratingStats[0].average_rating || '0')
      totalReviews = parseInt(ratingStats[0].total_reviews || '0')
    }
  } catch (error) {
    console.error("Error loading review stats:", error)
    // Continue without review stats if there's an error
  }

  // Get size chart image from subcategory (category with parent_id)
  let sizeChartImage: string | null = null
  if (product.categories && product.categories.length > 0) {
    const subcategory = product.categories.find((cat: any) => cat.parent_id && cat.size_chart_image)
    if (subcategory) {
      sizeChartImage = subcategory.size_chart_image
    }
  }

  return (
    <>
      <ProductSchema product={product} />
      <BreadcrumbSchema items={breadcrumbs} />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-[#BDBDBD] mb-6">
          {breadcrumbs.map((crumb, i) => (
            <span key={i}>
              {i > 0 && " / "}
              <a
                href={crumb.url}
                className="hover:text-[#F7F7F7] transition-colors"
              >
                {crumb.name}
              </a>
            </span>
          ))}
        </nav>

        <ColorImageProvider
          images={product.images || []}
          productName={product.name}
          productData={productData}
          averageRating={averageRating}
          totalReviews={totalReviews}
          sizeChartImage={sizeChartImage}
          variants={product.variants || []}
        />

        {/* Full Description */}
        {product.description && (
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold mb-4">Product Description</h2>
            <div
              className="prose prose-invert max-w-none text-[#BDBDBD]"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Size Chart Image - Display after description */}
        {sizeChartImage && (
          <div id="size-chart" className="mb-12 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold mb-4">Size Chart</h2>
            <div className="bg-[#121213] border border-[#1A1A1B] rounded-lg p-6">
              <div className="relative w-full max-w-4xl mx-auto">
                <img
                  src={sizeChartImage}
                  alt="Size Chart"
                  className="w-full h-auto object-contain mx-auto"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        )}


        {/* Hidden Add to Cart Button for form submission */}
        <div className="hidden">
          <AddToCartButton
            productId={product.id}
            disabled={product.stock === 0}
          />
        </div>

        {/* Reviews Section */}
        <div className="mt-16 pt-12 border-t border-[#1A1A1B]">
          <ReviewsSection productSlug={product.slug} />
        </div>

        {/* Similar Products */}
        <div className="mt-16 pt-12 border-t border-[#1A1A1B]">
          <h2 className="text-3xl font-serif font-bold mb-8">Similar Products</h2>
          {similarProducts.length > 0 ? (
            <ScrollableProducts
              products={similarProducts
                .filter((similarProduct: any) => similarProduct && similarProduct.id)
                .map((similarProduct: any) => {
                  // Handle images - could be array or JSON string
                  let images: any[] = []
                  try {
                    if (Array.isArray(similarProduct.images)) {
                      images = similarProduct.images
                    } else if (typeof similarProduct.images === 'string') {
                      images = JSON.parse(similarProduct.images)
                    } else if (similarProduct.images && typeof similarProduct.images === 'object') {
                      // Handle case where images might already be parsed
                      images = Array.isArray(similarProduct.images) ? similarProduct.images : []
                    }
                  } catch (e) {
                    console.error("Error parsing images for similar product:", e)
                    images = []
                  }

                  return {
                    id: similarProduct.id,
                    name: similarProduct.name || 'Product',
                    slug: similarProduct.slug || '',
                    price: parseFloat(similarProduct.price || '0'),
                    sale_price: similarProduct.sale_price ? parseFloat(similarProduct.sale_price) : undefined,
                    images: images || [],
                    shortDesc: similarProduct.short_desc,
                    available_colors: similarProduct.available_colors || [],
                    available_sizes: similarProduct.available_sizes || [],
                    stock: similarProduct.stock ? parseInt(String(similarProduct.stock)) : 0,
                  }
                })}
            />
          ) : (
            <p className="text-[#BDBDBD] text-center py-8">No similar products found at this time.</p>
          )}
        </div>
      </div>
    </>
  )
  } catch (error: any) {
    console.error("Error rendering product page:", error)
    throw error // Re-throw to let Next.js error boundary handle it
  }
}

