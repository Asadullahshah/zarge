import { sql } from "@/lib/db"
import { ProductGrid } from "@/components/product/product-grid"
import { Metadata } from "next"
import Link from "next/link"

// Force dynamic rendering to show latest products
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Premium Men's Clothing | Formal & Semi-Formal Wear | House of Noire",
  description: "Shop premium men's clothing collection at House of Noire. Discover elegant formal wear, semi-formal apparel, unstitched and stitched collections, and winter wear. Premium quality clothing with authentic Pakistani craftsmanship.",
  keywords: [
    "premium men's clothing",
    "men's formal wear",
    "men's semi-formal wear",
    "premium clothing for men",
    "luxury men's fashion",
    "designer men's clothing",
    "formal wear for men",
    "semi-formal men's apparel",
    "premium men's fashion",
    "luxury clothing men",
    "high-end men's fashion",
    "men's unstitched collection",
    "men's stitched collection"
  ],
  openGraph: {
    title: "Premium Men's Clothing | Formal & Semi-Formal Wear | House of Noire",
    description: "Shop premium men's clothing collection. Discover elegant formal wear, semi-formal apparel, unstitched and stitched collections.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Men's Clothing | House of Noire",
    description: "Shop premium men's clothing collection. Discover elegant formal wear, semi-formal apparel, and more.",
  },
}

export default async function MenPage({
  searchParams,
}: {
  searchParams: { page?: string; subcategory?: string }
}) {
  const page = parseInt(searchParams.page || "1")
  const limit = 20
  const offset = (page - 1) * limit

  // Get Men category
  const menCategory = await sql`
    SELECT id FROM categories WHERE slug = 'men'
  `

  if (menCategory.length === 0) {
    return <div className="container mx-auto px-4 py-8">Category not found</div>
  }

  const menId = menCategory[0].id

  // Get subcategories with at least 1 published product
  const subcategories = await sql`
    SELECT 
      c.*,
      COUNT(DISTINCT pc.product_id) as product_count
    FROM categories c
    INNER JOIN product_categories pc ON c.id = pc.category_id
    INNER JOIN products p ON pc.product_id = p.id AND p.status = 'PUBLISHED'
    WHERE c.parent_id = ${menId}
    GROUP BY c.id
    HAVING COUNT(DISTINCT pc.product_id) > 0
    ORDER BY c.name
  `

  // Build query based on subcategory filter
  let products: any[] = []
  let countResult: any[] = []

  if (searchParams.subcategory) {
    const subcat = await sql`
      SELECT id FROM categories WHERE slug = ${searchParams.subcategory} AND parent_id = ${menId}
    `
    if (subcat.length > 0) {
      const subcatId = subcat[0].id
      products = await sql`
        SELECT 
          p.*,
          json_agg(
            DISTINCT jsonb_build_object(
              'url', pi.url,
              'alt', pi.alt,
              'isPrimary', pi.is_primary,
              'order', pi."order",
              'color', pi.color
            )
          ) FILTER (WHERE pi.id IS NOT NULL) as images
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE p.status = 'PUBLISHED' AND pc.category_id = ${subcatId}
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE p.status = 'PUBLISHED' AND pc.category_id = ${subcatId}
      `
    } else {
      products = []
      countResult = [{ total: "0" }]
    }
  } else {
    // Get all products in Men category or its subcategories
    products = await sql`
      SELECT 
        p.*,
        json_agg(
          DISTINCT jsonb_build_object(
            'url', pi.url,
            'alt', pi.alt,
            'isPrimary', pi.is_primary,
            'order', pi."order",
            'color', pi.color
          )
        ) FILTER (WHERE pi.id IS NOT NULL) as images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      INNER JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.status = 'PUBLISHED' AND pc.category_id IN (
        SELECT id FROM categories WHERE id = ${menId} OR parent_id = ${menId}
      )
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    countResult = await sql`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      INNER JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.status = 'PUBLISHED' AND pc.category_id IN (
        SELECT id FROM categories WHERE id = ${menId} OR parent_id = ${menId}
      )
    `
  }

  const total = parseInt(countResult[0]?.total || "0")
  const totalPages = Math.ceil(total / limit)

  // Get total count for "All" option (all products in Men category and subcategories)
  const allProductsCountResult = await sql`
    SELECT COUNT(DISTINCT p.id) as total
    FROM products p
    INNER JOIN product_categories pc ON p.id = pc.product_id
    WHERE pc.category_id IN (
      SELECT id FROM categories WHERE id = ${menId} OR parent_id = ${menId}
    ) AND p.status = 'PUBLISHED'
  `
  const allProductsCount = parseInt(allProductsCountResult[0]?.total || "0")

  // Process products to calculate stock and filter sizes from variants
  const { processProductsWithVariants } = await import("@/lib/product-helpers")
  const processedProducts = await processProductsWithVariants(products as any[])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-4">Men&apos;s Collection</h1>
      
      {/* Subcategory Filters */}
      {subcategories.length > 0 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          <Link
            href="/men"
            className={`px-4 py-2 rounded ${
              !searchParams.subcategory
                ? "bg-primary text-primary-foreground"
                : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7] border border-[#1A1A1B]"
            }`}
          >
            All ({allProductsCount})
          </Link>
          {subcategories.map((subcat: any) => (
            <Link
              key={subcat.id}
              href={`/men?subcategory=${subcat.slug}`}
              className={`px-4 py-2 rounded ${
                searchParams.subcategory === subcat.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7] border border-[#1A1A1B]"
              }`}
            >
              {subcat.name} ({subcat.product_count || 0})
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-center text-[#BDBDBD] py-16">No products found.</p>
      ) : (
        <>
          <ProductGrid
            products={processedProducts.map((product: any) => ({
              ...product,
              images: product.images || [],
              price: parseFloat(product.price),
              salePrice: product.sale_price ? parseFloat(product.sale_price) : undefined,
              available_colors: product.available_colors || [],
              stock: product.stock ? parseInt(product.stock) : 0,
              available_sizes: product.available_sizes || [],
            }))}
          />

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${searchParams.subcategory ? `&subcategory=${searchParams.subcategory}` : ""}`}
                  className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
                >
                  Previous
                </a>
              )}
              <span className="px-4 py-2 text-[#BDBDBD]">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <a
                  href={`?page=${page + 1}${searchParams.subcategory ? `&subcategory=${searchParams.subcategory}` : ""}`}
                  className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

