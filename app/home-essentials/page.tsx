import { sql } from "@/lib/db"
import { ProductGrid } from "@/components/product/product-grid"
import { Metadata } from "next"
import Link from "next/link"

// Force dynamic rendering to show latest products
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Premium Home Essentials | Luxury Home Textiles | House of Noire",
  description: "Shop premium home essentials at House of Noire. Discover luxury bedsheets, premium quilts, comfortable blankets, elegant pillow covers, soft towels, and beautiful curtains. Transform your home with quality home textiles.",
  keywords: [
    "home essentials",
    "premium home textiles",
    "luxury bedsheets",
    "premium quilts",
    "home essentials store",
    "luxury home decor",
    "premium blankets",
    "designer pillow covers",
    "luxury towels",
    "premium curtains",
    "home textiles online",
    "luxury home essentials",
    "premium bedding",
    "high-quality home textiles",
    "home essentials Pakistan"
  ],
  openGraph: {
    title: "Premium Home Essentials | Luxury Home Textiles | House of Noire",
    description: "Shop premium home essentials. Discover luxury bedsheets, premium quilts, comfortable blankets, elegant pillow covers, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Home Essentials | House of Noire",
    description: "Shop premium home essentials. Discover luxury bedsheets, premium quilts, comfortable blankets, and more.",
  },
}

export default async function HomeEssentialsPage({
  searchParams,
}: {
  searchParams: { page?: string; subcategory?: string }
}) {
  const page = parseInt(searchParams.page || "1")
  const limit = 20
  const offset = (page - 1) * limit

  // Get Home Essentials category
  const homeCategory = await sql`
    SELECT id FROM categories WHERE slug = 'home-essentials'
  `

  if (homeCategory.length === 0) {
    return <div className="container mx-auto px-4 py-8">Category not found</div>
  }

  const homeId = homeCategory[0].id

  // Get subcategories with at least 1 published product
  const subcategories = await sql`
    SELECT 
      c.*,
      COUNT(DISTINCT pc.product_id) as product_count
    FROM categories c
    INNER JOIN product_categories pc ON c.id = pc.category_id
    INNER JOIN products p ON pc.product_id = p.id AND p.status = 'PUBLISHED'
    WHERE c.parent_id = ${homeId}
    GROUP BY c.id
    HAVING COUNT(DISTINCT pc.product_id) > 0
    ORDER BY c.name
  `

  // Build query based on subcategory filter
  let products: any[] = []
  let countResult: any[] = []

  if (searchParams.subcategory) {
    const subcat = await sql`
      SELECT id FROM categories WHERE slug = ${searchParams.subcategory} AND parent_id = ${homeId}
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
              'order', pi."order"
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
    // Get all products in Home Essentials category or its subcategories
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
        SELECT id FROM categories WHERE id = ${homeId} OR parent_id = ${homeId}
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
        SELECT id FROM categories WHERE id = ${homeId} OR parent_id = ${homeId}
      )
    `
  }

  const total = parseInt(countResult[0]?.total || "0")
  const totalPages = Math.ceil(total / limit)

  // Get total count for "All" option (all products in Home Essentials category and subcategories)
  const allProductsCountResult = await sql`
    SELECT COUNT(DISTINCT p.id) as total
    FROM products p
    INNER JOIN product_categories pc ON p.id = pc.product_id
    WHERE pc.category_id IN (
      SELECT id FROM categories WHERE id = ${homeId} OR parent_id = ${homeId}
    ) AND p.status = 'PUBLISHED'
  `
  const allProductsCount = parseInt(allProductsCountResult[0]?.total || "0")

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-4">Home Essentials</h1>
      <p className="text-lg text-[#BDBDBD] mb-6">
        Curated collection of premium bedsheets, quilts, blankets, and pillow covers
      </p>
      
      {/* Subcategory Filters */}
      {subcategories.length > 0 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          <Link
            href="/home-essentials"
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
              href={`/home-essentials?subcategory=${subcat.slug}`}
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
            products={products.map((product: any) => ({
              ...product,
              images: product.images || [],
              price: parseFloat(product.price),
              salePrice: product.sale_price ? parseFloat(product.sale_price) : undefined,
              available_colors: product.available_colors || [],
              stock: product.stock ? parseInt(product.stock) : 0,
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

