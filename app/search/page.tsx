import { sql } from "@/lib/db"
import { Metadata } from "next"
import { SearchResults } from "@/components/search/search-results"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Search | House of Noire",
  description: "Search for products",
}

async function searchProducts(query: string, page: number = 1, limit: number = 20) {
  try {
    const offset = (page - 1) * limit
    const searchPattern = `%${query}%`
    const searchPatternStart = `${query}%`

    const products = await sql`
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
        AND (p.name ILIKE ${searchPattern} OR p.short_desc ILIKE ${searchPattern} OR p.description ILIKE ${searchPattern})
      GROUP BY p.id
      ORDER BY 
        CASE 
          WHEN p.name ILIKE ${searchPatternStart} THEN 1
          WHEN p.name ILIKE ${searchPattern} THEN 2
          ELSE 3
        END,
        p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE p.status = 'PUBLISHED'
        AND (p.name ILIKE ${searchPattern} OR p.short_desc ILIKE ${searchPattern} OR p.description ILIKE ${searchPattern})
    `

    const total = parseInt(countResult[0]?.total || "0")
    const totalPages = Math.ceil(total / limit)

    return {
      products: products as any[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error: any) {
    console.error("Search error:", error)
    throw new Error(error.message || "Failed to search products")
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const query = searchParams.q || ""
  const page = parseInt(searchParams.page || "1")

  if (!query.trim()) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Search Products</h1>
          <p className="text-[#BDBDBD]">Enter a search term to find products</p>
        </div>
      </div>
    )
  }

  try {
    const { products, pagination } = await searchProducts(query, page)

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">
            Search Results for &quot;{query}&quot;
          </h1>
          {pagination.total > 0 ? (
            <p className="text-[#BDBDBD]">
              Found {pagination.total} result{pagination.total !== 1 ? "s" : ""}
            </p>
          ) : (
            <p className="text-[#BDBDBD]">No results found</p>
          )}
        </div>

        <SearchResults
          products={products}
          query={query}
          pagination={pagination}
        />
      </div>
    )
  } catch (error: any) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-serif font-bold mb-4 text-destructive">
            Search Error
          </h1>
          <p className="text-[#BDBDBD] mb-4">
            {error?.message || "An error occurred while searching. Please try again."}
          </p>
          <a
            href="/"
            className="text-primary hover:underline"
          >
            Return to Home
          </a>
        </div>
      </div>
    )
  }
}

