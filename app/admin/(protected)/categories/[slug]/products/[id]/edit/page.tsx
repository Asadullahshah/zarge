import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { CategorySpecificForm } from "@/components/admin/category-specific-forms"
import { getCategoryFormType } from "@/lib/category-forms"
import Link from "next/link"

export default async function EditCategoryProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  await requireAuth()
  
  const { slug, id } = await params

  const [category, product] = await Promise.all([
    sql`SELECT * FROM categories WHERE slug = ${slug}`,
    sql`SELECT * FROM products WHERE id = ${id}`,
  ])

  if (category.length === 0 || product.length === 0) {
    notFound()
  }

  const [categoryData] = category
  const [productData] = product

  // Get related data
  const [images, variants] = await Promise.all([
    sql`
      SELECT * FROM product_images
      WHERE product_id = ${id}
      ORDER BY "order" ASC
    `,
    sql`
      SELECT * FROM variants
      WHERE product_id = ${id}
    `,
  ])

  const productWithRelations = {
    ...productData,
    images: images as any[],
    variants: variants as any[],
  }

  // Check if this is a subcategory
  const isSubcategory = categoryData.parent_id !== null

  // Get parent category if this is a subcategory
  let parentCategory = null
  if (isSubcategory) {
    const parent = await sql`
      SELECT * FROM categories WHERE id = ${categoryData.parent_id}
    `
    if (parent.length > 0) {
      parentCategory = parent[0]
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-[#BDBDBD] mb-4">
        <Link href="/admin/categories" className="hover:text-[#F7F7F7]">Categories</Link>
        {" / "}
        <Link href={`/admin/categories/${slug}/products`} className="hover:text-[#F7F7F7]">
          {categoryData.name}
        </Link>
        {" / "}
        <span className="text-[#F7F7F7]">Edit Product</span>
      </nav>

      <div className="bg-gradient-to-r from-[#1A1A1B] to-[#121213] rounded-lg p-8 mb-8 border border-[#1A1A1B]">
        {isSubcategory && parentCategory && (
          <div className="text-sm text-primary mb-2 font-semibold">{parentCategory.name}</div>
        )}
        <h1 className="text-4xl font-serif font-bold mb-2">
          Edit Product in {categoryData.name}
        </h1>
        <p className="text-lg text-[#BDBDBD]">
          Update product details and information
        </p>
      </div>

      <CategorySpecificForm
        product={productWithRelations}
        categoryId={categoryData.id}
        categorySlug={slug}
        categoryName={categoryData.name}
        formType={getCategoryFormType(slug)}
      />
    </div>
  )
}

