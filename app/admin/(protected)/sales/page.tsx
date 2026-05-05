import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import { SalesManager } from "@/components/admin/sales-manager"

export default async function SalesPage() {
  await requireAuth()

  // Get all categories with hierarchy for sale selection
  const allCategories = await sql`
    SELECT 
      c.*,
      p.name as parent_name
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    ORDER BY 
      CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END,
      COALESCE(p.name, c.name),
      c.name
  `

  // Organize categories for display
  const mainCategories = (allCategories as any[]).filter((cat: any) => !cat.parent_id)
  const subCategories = (allCategories as any[]).filter((cat: any) => cat.parent_id)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold mb-2">Sale Management</h1>
        <p className="text-[#BDBDBD]">
          Apply sale percentages to categories, subcategories, or the entire inventory. 
          Sale prices will be automatically calculated and applied to all products.
        </p>
      </div>

      <SalesManager 
        mainCategories={mainCategories}
        subCategories={subCategories}
      />
    </div>
  )
}


