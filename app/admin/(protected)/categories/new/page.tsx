import { requireAuth } from "@/lib/auth-helpers"
import { CategoryForm } from "@/components/admin/category-form"
import { sql } from "@/lib/db"

export default async function NewCategoryPage() {
  await requireAuth()

  const categories = await sql`
    SELECT id, name, slug
    FROM categories
    ORDER BY name
  `

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8">Add New Category</h1>
      <CategoryForm parentCategories={categories as any[]} />
    </div>
  )
}

