import { requireAuth } from "@/lib/auth-helpers"
import { ProductForm } from "@/components/admin/product-form"
import { sql } from "@/lib/db"

export default async function NewProductPage() {
  await requireAuth()

  const categories = await sql`
    SELECT id, name, slug
    FROM categories
    ORDER BY name
  `

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8">Add New Product</h1>
      <ProductForm categories={categories as any[]} />
    </div>
  )
}

