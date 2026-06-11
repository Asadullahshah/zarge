import { sql } from "@/lib/db"
import { ProductGrid } from "@/components/product/product-grid"
import { Metadata } from "next"
// Force dynamic rendering to show latest products
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "All Products | Zarge",
  description: "Browse our complete collection of premium fashion and home essentials",
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; sort?: string; featured?: string }
}) {
  const page = parseInt(searchParams.page || "1")
  const limit = 20
  const offset = (page - 1) * limit
  const sortBy = searchParams.sort || "featured"
  const isFeatured = searchParams.featured === "true"

  // Get products with dynamic sorting
  let products: any[]

  switch (sortBy) {
    case "price-low":
      if (isFeatured) {
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
          WHERE p.status = 'PUBLISHED' AND COALESCE(p.featured, false) = true
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
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
          WHERE p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
      break
    case "price-high":
      if (isFeatured) {
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
          WHERE p.status = 'PUBLISHED' AND COALESCE(p.featured, false) = true
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
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
          WHERE p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY COALESCE(p.sale_price, p.price) DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
      break
    case "newest":
      if (isFeatured) {
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
          WHERE p.status = 'PUBLISHED' AND COALESCE(p.featured, false) = true
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
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
          WHERE p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
      break
    case "oldest":
      if (isFeatured) {
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
          WHERE p.status = 'PUBLISHED' AND COALESCE(p.featured, false) = true
          GROUP BY p.id
          ORDER BY p.created_at ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
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
          WHERE p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.created_at ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
      break
    case "name-asc":
      if (isFeatured) {
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
          WHERE p.status = 'PUBLISHED' AND COALESCE(p.featured, false) = true
          GROUP BY p.id
          ORDER BY p.name ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
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
          WHERE p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.name ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
      break
    case "name-desc":
      if (isFeatured) {
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
          WHERE p.status = 'PUBLISHED' AND COALESCE(p.featured, false) = true
          GROUP BY p.id
          ORDER BY p.name DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
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
          WHERE p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.name DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
      break
    default:
      if (isFeatured) {
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
          WHERE p.status = 'PUBLISHED' AND COALESCE(p.featured, false) = true
          GROUP BY p.id
          ORDER BY p.featured DESC, p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
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
          WHERE p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.featured DESC, p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
  }

  // Get total count
  let countResult: any[]
  if (isFeatured) {
    countResult = await sql`
      SELECT COUNT(*) as total
      FROM products p
      WHERE p.status = 'PUBLISHED' AND COALESCE(p.featured, false) = true
    `
  } else {
    countResult = await sql`
      SELECT COUNT(*) as total
      FROM products p
      WHERE p.status = 'PUBLISHED'
    `
  }
  const total = parseInt(countResult[0]?.total || "0")
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
            {isFeatured ? "Featured Products" : "All Products"}
          </h1>
          <p className="text-base md:text-lg text-[#BDBDBD]">
            {isFeatured
              ? "Handpicked selections from our premium collection"
              : "Browse our complete collection"}
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-xl text-[#BDBDBD] mb-4">
            {isFeatured
              ? "No featured products available at the moment."
              : "No products found."}
          </p>
          {isFeatured && (
            <a
              href="/products"
              className="text-primary hover:underline"
            >
              View all products
            </a>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-[#BDBDBD]">
            Showing {products.length} of {total} products
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
            <div className="flex justify-center gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}${sortBy ? `&sort=${sortBy}` : ""}${isFeatured ? "&featured=true" : ""}`}
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
                  href={`?page=${page + 1}${sortBy ? `&sort=${sortBy}` : ""}${isFeatured ? "&featured=true" : ""}`}
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

