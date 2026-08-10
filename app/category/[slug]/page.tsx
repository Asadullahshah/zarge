import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { CategoryFAQSchema } from "@/components/seo/category-faq-schema"
import { getCategoryProducts } from "./page-helper"
import Link from "next/link"
import { ProductToolbar } from "@/components/product/product-toolbar"

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCategory(slug: string) {
  const category = await sql`
    SELECT * FROM categories WHERE slug = ${slug}
  `
  if (category.length === 0) return null
  return category[0]
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const category = await getCategory(params.slug)
  if (!category) return {}

  const categoryDescription = category.description || `Shop premium ${category.name} at Zargé. Discover our curated collection of ${category.name.toLowerCase()} featuring premium quality and authentic Pakistani craftsmanship.`
  
  return {
    title: `Premium ${category.name} | Luxury Fashion & Home Essentials | Zargé`,
    description: categoryDescription.substring(0, 160),
    keywords: [
      `premium ${category.name.toLowerCase()}`,
      `luxury ${category.name.toLowerCase()}`,
      `${category.name.toLowerCase()} collection`,
      "premium clothing",
      "luxury fashion",
      "Zargé",
      ...(category.name.includes("Men") || category.name.includes("Women") 
        ? ["premium fashion", "designer clothing", "high-end fashion"]
        : ["home essentials", "premium home textiles", "luxury home decor"])
    ],
    openGraph: {
      title: `Premium ${category.name} | Zargé`,
      description: categoryDescription.substring(0, 200),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Premium ${category.name} | Zargé`,
      description: categoryDescription.substring(0, 200),
    },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  // CHANGED: removed page, sort, columns from searchParams — all handled client-side now
  searchParams: { subcategory?: string }
}) {
  const category = await getCategory(params.slug)
  if (!category) notFound()

  const isParentCategory = category.parent_id === null

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

  // CHANGED: fetch all products at once, no limit/offset, no server-side sort
  const [rawProducts, faqs] = await Promise.all([
    getCategoryProducts(filterCategoryId, useParentCategoryQuery, "featured", 1000, 0),
    sql`
      SELECT * FROM category_faqs
      WHERE category_id = ${category.id}
      ORDER BY "order" ASC, created_at ASC
    `,
  ])

  // const MOCK_PRODUCTS = Array.from({ length: 47 }, (_, i) => ({
  //   id: `product-${i + 1}`,
  //   name: `Test Product ${i + 1}`,
  //   slug: `test-product-${i + 1}`,
  //   price: parseFloat((Math.random() * 5000 + 500).toFixed(2)),
  //   salePrice: i % 3 === 0 ? parseFloat((Math.random() * 3000 + 300).toFixed(2)) : undefined,
  //   images: [`https://picsum.photos/seed/${i + 1}/400/500`],
  //   available_colors: ["Black", "White", "Navy"].slice(0, (i % 3) + 1),
  //   available_sizes: ["S", "M", "L", "XL"].slice(0, (i % 4) + 1),
  //   stock: Math.floor(Math.random() * 50) + 1,
  //   status: "PUBLISHED",
  //   category_id: "mock-cat",
  // }))

  const { processProductsWithVariants } = await import("@/lib/product-helpers")
  const products = await processProductsWithVariants(rawProducts as any[])

  // const rawProcessed = await processProductsWithVariants(rawProducts as any[])
  // const products = MOCK_PRODUCTS  

  let allProductsCount = products.length
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
        <div className="w-full px-4 py-8">
          <h1 className="text-4xl font-serif font-bold mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-lg text-[#BDBDBD] mb-4">{category.description}</p>
          )}

          {/* Subcategories Filter */}
          {isParentCategory && subcategories.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/category/${category.slug}`}
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
                    href={`/category/${category.slug}?subcategory=${subcat.slug}`}
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

          {/* CHANGED: no pagination UI here, ProductToolbar handles it all */}
          {products.length === 0 ? (
            <p className="text-center text-[#BDBDBD] py-16">No products found in this category.</p>
          ) : (
            <ProductToolbar
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
          )}
        </div>
      </div>
    </>
  )
}