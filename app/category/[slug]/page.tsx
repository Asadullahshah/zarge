import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { ProductGrid } from "@/components/product/product-grid"
import { Metadata } from "next"
import { CategoryFAQSchema } from "@/components/seo/category-faq-schema"
import { SortSelector } from "@/components/category/sort-selector"
import { getCategoryProducts } from "./page-helper"
import Link from "next/link"

// Force dynamic rendering to show latest products
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCategory(slug: string) {
  const category = await sql`
    SELECT * FROM categories WHERE slug = ${slug}
  `

  if (category.length === 0) {
    return null
  }

  return category[0]
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const category = await getCategory(params.slug)

  if (!category) {
    return {}
  }

  const categoryDescription = category.description || `Shop premium ${category.name} at Zarge. Discover our curated collection of ${category.name.toLowerCase()} featuring premium quality and authentic Pakistani craftsmanship.`
  
  return {
    title: `Premium ${category.name} | Luxury Fashion & Home Essentials | Zarge`,
    description: categoryDescription.substring(0, 160),
    keywords: [
      `premium ${category.name.toLowerCase()}`,
      `luxury ${category.name.toLowerCase()}`,
      `${category.name.toLowerCase()} collection`,
      "premium clothing",
      "luxury fashion",
      "Zarge",
      ...(category.name.includes("Men") || category.name.includes("Women") 
        ? ["premium fashion", "designer clothing", "high-end fashion"]
        : ["home essentials", "premium home textiles", "luxury home decor"])
    ],
    openGraph: {
      title: `Premium ${category.name} | Zarge`,
      description: categoryDescription.substring(0, 200),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Premium ${category.name} | Zarge`,
      description: categoryDescription.substring(0, 200),
    },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { page?: string; sort?: string; subcategory?: string }
}) {
  const category = await getCategory(params.slug)

  if (!category) {
    notFound()
  }

  const page = parseInt(searchParams.page || "1")
  const limit = 20
  const offset = (page - 1) * limit
  const sortBy = searchParams.sort || "featured"

  // Check if this is a parent category (has subcategories)
  const isParentCategory = category.parent_id === null

  // Get subcategories with at least 1 published product if this is a parent category
  let subcategories: any[] = []
  if (isParentCategory) {
    subcategories = await sql`
      SELECT 
        c.*,
        COUNT(DISTINCT pc.product_id) as product_count
      FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      INNER JOIN products p ON pc.product_id = p.id AND p.status = 'PUBLISHED'
      WHERE c.parent_id = ${category.id}
      GROUP BY c.id
      HAVING COUNT(DISTINCT pc.product_id) > 0
      ORDER BY c.name
    `
  }

  // Determine which category to filter by
  let filterCategoryId = category.id
  let selectedSubcategory: any = null
  let useParentCategoryQuery = isParentCategory && !searchParams.subcategory

  if (searchParams.subcategory && isParentCategory) {
    const subcat = await sql`
      SELECT * FROM categories 
      WHERE slug = ${searchParams.subcategory} AND parent_id = ${category.id}
    `
    if (subcat.length > 0) {
      filterCategoryId = subcat[0].id
      selectedSubcategory = subcat[0]
      useParentCategoryQuery = false
    }
  }

  // Get products using helper function
  const [rawProducts, faqs] = await Promise.all([
    getCategoryProducts(filterCategoryId, useParentCategoryQuery, sortBy, limit, offset),
    sql`
      SELECT * FROM category_faqs
      WHERE category_id = ${category.id}
      ORDER BY "order" ASC, created_at ASC
    `,
  ])

  // Process products to calculate stock and filter sizes from variants
  const { processProductsWithVariants } = await import("@/lib/product-helpers")
  const products = await processProductsWithVariants(rawProducts as any[])

  // Get count for the filtered category
  const countResult = useParentCategoryQuery
    ? await sql`
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE pc.category_id IN (
          SELECT id FROM categories 
          WHERE id = ${category.id} OR parent_id = ${category.id}
        ) AND p.status = 'PUBLISHED'
      `
    : await sql`
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE pc.category_id = ${filterCategoryId} AND p.status = 'PUBLISHED'
      `
  const total = parseInt(countResult[0]?.total || "0")
  const totalPages = Math.ceil(total / limit)

  // Get total count for "All" option (all products in parent category and subcategories)
  let allProductsCount = total
  if (isParentCategory) {
    const allCountResult = await sql`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      INNER JOIN product_categories pc ON p.id = pc.product_id
      WHERE pc.category_id IN (
        SELECT id FROM categories 
        WHERE id = ${category.id} OR parent_id = ${category.id}
      ) AND p.status = 'PUBLISHED'
    `
    allProductsCount = parseInt(allCountResult[0]?.total || "0")
  }

  return (
    <>
      <CategoryFAQSchema category={category} faqs={faqs as any[]} />
    <div className="relative z-10 bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-serif font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-lg text-[#BDBDBD] mb-4">{category.description}</p>
        )}

        {/* Subcategories Filter */}
        {isParentCategory && subcategories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/category/${category.slug}${searchParams.sort ? `?sort=${searchParams.sort}` : ''}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !searchParams.subcategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-[#121213] text-[#BDBDBD] hover:bg-[#1A1A1B] hover:text-[#F7F7F7] border border-[#1A1A1B]"
                }`}
              >
                All ({allProductsCount})
              </Link>
              {subcategories.map((subcat: any) => (
                <Link
                  key={subcat.id}
                  href={`/category/${category.slug}?subcategory=${subcat.slug}${searchParams.sort ? `&sort=${searchParams.sort}` : ''}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    searchParams.subcategory === subcat.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-[#121213] text-[#BDBDBD] hover:bg-[#1A1A1B] hover:text-[#F7F7F7] border border-[#1A1A1B]"
                  }`}
                >
                  {subcat.name} ({subcat.product_count || 0})
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Selected Subcategory Info */}
        {selectedSubcategory && (
          <div className="mb-6">
            <p className="text-sm text-[#BDBDBD]">
              Showing products in: <span className="text-primary font-semibold">{selectedSubcategory.name}</span>
            </p>
          </div>
        )}

        {/* FAQs Section */}
        {faqs.length > 0 && (
          <div className="bg-[#121213] rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-serif font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq: any) => (
                <div key={faq.id} className="border-b border-[#1A1A1B] pb-6 last:border-0">
                  <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                  <p className="text-[#BDBDBD]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {products.length === 0 ? (
          <p className="text-center text-[#BDBDBD] py-16">No products found in this category.</p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[#BDBDBD]">
                Showing {products.length} of {total} products
              </p>
              <SortSelector />
            </div>
            <ProductGrid
              products={products.map((product: any) => ({
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
                    href={`?page=${page - 1}${searchParams.subcategory ? `&subcategory=${searchParams.subcategory}` : ''}${searchParams.sort ? `&sort=${searchParams.sort}` : ''}`}
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
                    href={`?page=${page + 1}${searchParams.subcategory ? `&subcategory=${searchParams.subcategory}` : ''}${searchParams.sort ? `&sort=${searchParams.sort}` : ''}`}
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
    </div>
    </>
  )
}
