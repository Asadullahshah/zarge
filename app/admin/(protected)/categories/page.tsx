import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, ChevronRight, ChevronDown } from "lucide-react"
import { CategoryTree } from "@/components/admin/category-tree"

export default async function CategoriesPage() {
  await requireAuth()

  // Get all categories with hierarchy
  const allCategories = await sql`
    SELECT 
      c.*,
      COUNT(DISTINCT pc.product_id) as product_count,
      (
        SELECT COUNT(*) 
        FROM categories children 
        WHERE children.parent_id = c.id
      ) as child_count
    FROM categories c
    LEFT JOIN product_categories pc ON c.id = pc.category_id
    GROUP BY c.id
    ORDER BY c.name
  `

  // Organize into parent-child structure
  const parentCategories = (allCategories as any[]).filter((cat) => !cat.parent_id)
  const childCategories = (allCategories as any[]).filter((cat) => cat.parent_id)

  const categoriesWithChildren = parentCategories.map((parent) => ({
    ...parent,
    children: childCategories.filter((child) => child.parent_id === parent.id),
  }))

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-serif font-bold mb-2">Categories & Subcategories</h1>
            <p className="text-[#BDBDBD]">
              Manage your product categories. Each category can have subcategories for better organization.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/categories/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Category Structure</h3>
              <p className="text-sm text-[#BDBDBD] mb-2">
                Products are organized by main categories (Men, Women, Home Essentials) and their subcategories. 
                Click on any category to manage products and FAQs.
              </p>
              <p className="text-sm text-[#BDBDBD]">
                <strong className="text-primary">Size Charts:</strong> You can add a size chart image to each subcategory. 
                The size chart will automatically appear on all products in that subcategory. Click &quot;Edit&quot; on any subcategory to add a size chart image.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CategoryTree categories={categoriesWithChildren} />
    </div>
  )
}
