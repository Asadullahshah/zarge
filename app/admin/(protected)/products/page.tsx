import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function ProductsPage() {
  await requireAuth()

  const products = await sql`
    SELECT 
      p.*,
      COUNT(DISTINCT pi.id) as image_count,
      COUNT(DISTINCT v.id) as variant_count
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    LEFT JOIN variants v ON p.id = v.product_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 50
  `

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold">Products</h1>
        <Link href="/admin/products/new">
          <Button className="w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="bg-[#121213] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-[#1A1A1B]">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Gender</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Images</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product: any) => (
              <tr key={product.id} className="border-t border-[#1A1A1B]">
                <td className="p-4">{product.name}</td>
                <td className="p-4">{product.type}</td>
                <td className="p-4">{product.gender}</td>
                <td className="p-4">${parseFloat(product.price).toFixed(2)}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      product.status === "PUBLISHED"
                        ? "bg-green-500/20 text-green-400"
                        : product.status === "DRAFT"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="p-4">{product.image_count || 0}</td>
                <td className="p-4">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

