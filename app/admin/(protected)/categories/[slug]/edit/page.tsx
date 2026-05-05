import { requireAuth } from "@/lib/auth-helpers"
import { CategoryForm } from "@/components/admin/category-form"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"

export default async function EditCategoryPage({
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

  const allCategories = await sql`
    SELECT id, name, slug
    FROM categories
    WHERE id != ${category[0].id}
    ORDER BY name
  `

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8">Edit Category</h1>
      <CategoryForm category={category[0]} parentCategories={allCategories as any[]} />
    </div>
  )
}

