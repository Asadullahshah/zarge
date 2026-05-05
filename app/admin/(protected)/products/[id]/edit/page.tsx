import { requireAuth } from "@/lib/auth-helpers"
import { ProductForm } from "@/components/admin/product-form"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAuth()

  const product = await sql`
    SELECT * FROM products WHERE id = ${params.id}
  `

  if (product.length === 0) {
    notFound()
  }

  const [productData] = product

  // Get related data
  const [images, variants, categories] = await Promise.all([
    sql`
      SELECT * FROM product_images
      WHERE product_id = ${params.id}
      ORDER BY "order" ASC
    `,
    sql`
      SELECT * FROM variants
      WHERE product_id = ${params.id}
    `,
    sql`
      SELECT c.* FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ${params.id}
    `,
  ])

  const allCategories = await sql`
    SELECT id, name, slug
    FROM categories
    ORDER BY name
  `

  const productWithRelations = {
    ...productData,
    images: images as any[],
    variants: variants as any[],
    categories: categories as any[],
  }

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8">Edit Product</h1>
      <ProductForm product={productWithRelations} categories={allCategories as any[]} />
    </div>
  )
}

