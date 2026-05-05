import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { CategorySpecificForm } from "@/components/admin/category-specific-forms"
import { getCategoryFormType } from "@/lib/category-forms"
import Link from "next/link"

export default async function NewCategoryProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await requireAuth()
  
  const { slug } = await params

  const category = await sql`
    SELECT * FROM categories WHERE slug = ${slug}
  `

  if (category.length === 0) {
    notFound()
  }

  const [categoryData] = category

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
        <span className="text-[#F7F7F7]">New Product</span>
      </nav>

      <div className="bg-gradient-to-r from-[#1A1A1B] to-[#121213] rounded-lg p-8 mb-8 border border-[#1A1A1B]">
        {isSubcategory && parentCategory && (
          <div className="text-sm text-primary mb-2 font-semibold">{parentCategory.name}</div>
        )}
        <h1 className="text-4xl font-serif font-bold mb-2">
          Add Product to {categoryData.name}
        </h1>
        <p className="text-lg text-[#BDBDBD]">
          Create a new product that will be added to this category
        </p>
      </div>

      <CategorySpecificForm
        categoryId={categoryData.id}
        categorySlug={slug}
        categoryName={categoryData.name}
        formType={getCategoryFormType(slug)}
      />
    </div>
  )
}

