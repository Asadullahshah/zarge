import { sql } from "@/lib/db"
import { ProductGrid } from "@/components/product/product-grid"
import { Metadata } from "next"
import Link from "next/link"
import { SortSelector } from "@/components/category/sort-selector"

// Force dynamic rendering to show latest products
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Sale - Premium Fashion & Home Essentials | Zarge",
  description: "Shop exclusive sale on premium luxury fashion and home essentials. Get discounted prices on formal wear, semi-formal apparel, luxury bedsheets, premium quilts, and more. Limited time offers on premium clothing and home textiles.",
  keywords: [
    "premium clothing sale",
    "luxury fashion sale",
    "home essentials sale",
    "premium fashion discount",
    "sale on luxury clothing",
    "discounted premium clothing",
    "sale home textiles",
    "premium clothing deals",
    "luxury fashion sale",
    "home essentials discount",
    "premium fashion offers"
  ],
  openGraph: {
    title: "Sale - Premium Fashion & Home Essentials | Zarge",
    description: "Shop exclusive sale on premium luxury fashion and home essentials. Get discounted prices on formal wear, semi-formal apparel, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sale - Premium Fashion & Home Essentials",
    description: "Shop exclusive sale on premium luxury fashion and home essentials. Limited time offers.",
  },
}

export default async function SalePage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string; sort?: string }
}) {
  const page = parseInt(searchParams.page || "1")
  const limit = 20
  const offset = (page - 1) * limit
  const categoryFilter = searchParams.category || "all"
  const sortBy = searchParams.sort || "featured"

  // Get main category IDs
  const [menCategory, womenCategory, homeCategory] = await Promise.all([
    sql`SELECT id FROM categories WHERE slug = 'men'`,
    sql`SELECT id FROM categories WHERE slug = 'women'`,
    sql`SELECT id FROM categories WHERE slug = 'home-essentials'`,
  ])

  const menId = menCategory[0]?.id
  const womenId = womenCategory[0]?.id
  const homeId = homeCategory[0]?.id

  // Get product counts for each category
  const getCategoryCount = async (categoryId: string | undefined) => {
    if (!categoryId) return 0
    const result = await sql`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      INNER JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.status = 'PUBLISHED' 
        AND p.sale_price IS NOT NULL 
        AND p.sale_price > 0
        AND pc.category_id IN (
          SELECT id FROM categories WHERE id = ${categoryId} OR parent_id = ${categoryId}
        )
    `
    return parseInt(result[0]?.total || "0")
  }

  const [menCount, womenCount, homeCount, allCount] = await Promise.all([
    getCategoryCount(menId),
    getCategoryCount(womenId),
    getCategoryCount(homeId),
    sql`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE p.status = 'PUBLISHED' 
        AND p.sale_price IS NOT NULL 
        AND p.sale_price > 0
    `.then((result) => parseInt(result[0]?.total || "0")),
  ])

  // Build query based on category filter and sort
  let products: any[] = []
  let countResult: any[] = []

  // Determine which category ID to filter by
  let categoryId: string | undefined
  if (categoryFilter === "men" && menId) {
    categoryId = menId
  } else if (categoryFilter === "women" && womenId) {
    categoryId = womenId
  } else if (categoryFilter === "home-essentials" && homeId) {
    categoryId = homeId
  }

  // Build queries based on category filter and sort
  if (categoryId) {
    // Query with category filter
    switch (sortBy) {
      case "price-low":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
            AND pc.category_id IN (
              SELECT id FROM categories WHERE id = ${categoryId} OR parent_id = ${categoryId}
            )
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) ASC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      case "price-high":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
            AND pc.category_id IN (
              SELECT id FROM categories WHERE id = ${categoryId} OR parent_id = ${categoryId}
            )
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      case "newest":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
            AND pc.category_id IN (
              SELECT id FROM categories WHERE id = ${categoryId} OR parent_id = ${categoryId}
            )
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      case "oldest":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
            AND pc.category_id IN (
              SELECT id FROM categories WHERE id = ${categoryId} OR parent_id = ${categoryId}
            )
          GROUP BY p.id
          ORDER BY p.created_at ASC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      case "name-asc":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
            AND pc.category_id IN (
              SELECT id FROM categories WHERE id = ${categoryId} OR parent_id = ${categoryId}
            )
          GROUP BY p.id
          ORDER BY p.name ASC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      case "name-desc":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
            AND pc.category_id IN (
              SELECT id FROM categories WHERE id = ${categoryId} OR parent_id = ${categoryId}
            )
          GROUP BY p.id
          ORDER BY p.name DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      default:
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
            AND pc.category_id IN (
              SELECT id FROM categories WHERE id = ${categoryId} OR parent_id = ${categoryId}
            )
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
    }
    countResult = await sql`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      INNER JOIN product_categories pc ON p.id = pc.product_id
      WHERE p.status = 'PUBLISHED' 
        AND p.sale_price IS NOT NULL 
        AND p.sale_price > 0
        AND pc.category_id IN (
          SELECT id FROM categories WHERE id = ${categoryId} OR parent_id = ${categoryId}
        )
    `
  } else {
    // Query for all sale products
    switch (sortBy) {
      case "price-low":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) ASC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      case "price-high":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      case "newest":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      case "oldest":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
          GROUP BY p.id
          ORDER BY p.created_at ASC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      case "name-asc":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
          GROUP BY p.id
          ORDER BY p.name ASC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      case "name-desc":
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
          GROUP BY p.id
          ORDER BY p.name DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        break
      default:
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
          WHERE p.status = 'PUBLISHED' 
            AND p.sale_price IS NOT NULL 
            AND p.sale_price > 0
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
    }
    countResult = await sql`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE p.status = 'PUBLISHED' 
        AND p.sale_price IS NOT NULL 
        AND p.sale_price > 0
    `
  }

  const total = parseInt(countResult[0]?.total || "0")
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold mb-2">Sale</h1>
          <p className="text-lg text-[#BDBDBD]">
            Exclusive discounts on premium fashion and home essentials
          </p>
        </div>
        <SortSelector />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <Link
          href="/sale"
          className={`px-4 py-2 rounded transition-colors ${
            categoryFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7] border border-[#1A1A1B]"
          }`}
        >
          All ({allCount})
        </Link>
        <Link
          href="/sale?category=men"
          className={`px-4 py-2 rounded transition-colors ${
            categoryFilter === "men"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7] border border-[#1A1A1B]"
          }`}
        >
          Men ({menCount})
        </Link>
        <Link
          href="/sale?category=women"
          className={`px-4 py-2 rounded transition-colors ${
            categoryFilter === "women"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7] border border-[#1A1A1B]"
          }`}
        >
          Women ({womenCount})
        </Link>
        <Link
          href="/sale?category=home-essentials"
          className={`px-4 py-2 rounded transition-colors ${
            categoryFilter === "home-essentials"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7] border border-[#1A1A1B]"
          }`}
        >
          Home Essentials ({homeCount})
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-[#BDBDBD] mb-4">
            No products on sale found in this category.
          </p>
          <Link
            href="/products"
            className="text-primary hover:underline"
          >
            View all products
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-[#BDBDBD]">
            Showing {products.length} of {total} products on sale
          </div>

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
            <div className="flex justify-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={`/sale?page=${page - 1}${categoryFilter !== "all" ? `&category=${categoryFilter}` : ""}${sortBy ? `&sort=${sortBy}` : ""}`}
                  className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
                >
                  Previous
                </Link>
              )}
              <span className="px-4 py-2 text-[#BDBDBD]">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/sale?page=${page + 1}${categoryFilter !== "all" ? `&category=${categoryFilter}` : ""}${sortBy ? `&sort=${sortBy}` : ""}`}
                  className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

