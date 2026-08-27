import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Package, Edit, Trash2 } from "lucide-react"
import { DeleteProductButton } from "@/components/admin/delete-product-button"
import { FeaturedToggle } from "@/components/admin/featured-toggle"

export default async function CategoryProductsPage({
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

  const products = await sql`
    SELECT 
      p.*,
      COUNT(DISTINCT pi.id) as image_count,
      COUNT(DISTINCT v.id) as variant_count
    FROM products p
    INNER JOIN product_categories pc ON p.id = pc.product_id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    LEFT JOIN variants v ON p.id = v.product_id
    WHERE pc.category_id = ${categoryData.id}
    GROUP BY p.id
    ORDER BY p.featured DESC, p.created_at DESC
  `

  // Check if this is a parent or subcategory
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
      {isSubcategory && parentCategory && (
        <nav className="text-sm text-[#BDBDBD] mb-4">
          <Link href="/admin/categories" className="hover:text-[#F7F7F7]">Categories</Link>
          {" / "}
          <Link href={`/admin/categories/${parentCategory.slug}/products`} className="hover:text-[#F7F7F7]">
            {parentCategory.name}
          </Link>
          {" / "}
          <span className="text-[#F7F7F7]">{categoryData.name}</span>
        </nav>
      )}

      <div className="bg-gradient-to-r from-[#1A1A1B] to-[#121213] rounded-lg p-5 sm:p-8 mb-8 border border-[#1A1A1B]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {isSubcategory && parentCategory && (
              <div className="text-sm text-primary mb-2 font-semibold">{parentCategory.name}</div>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-2">{categoryData.name}</h1>
            <p className="text-base sm:text-lg text-[#BDBDBD]">{categoryData.description || "Manage products in this category"}</p>
          </div>
          <Link href={`/admin/categories/${slug}/products/new`}>
            <Button size="lg" className="w-full sm:w-auto justify-center">
              <Plus className="w-5 h-5 mr-2" />
              Add New Product
            </Button>
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-[#121213] rounded-lg border-2 border-dashed border-[#1A1A1B] p-16 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-[#BDBDBD]" />
          <h3 className="text-2xl font-semibold mb-2">No products yet</h3>
          <p className="text-[#BDBDBD] mb-6">
            Get started by adding your first product to {categoryData.name}
          </p>
          <Link href={`/admin/categories/${slug}/products/new`}>
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Product
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-[#121213] rounded-lg overflow-hidden border border-[#1A1A1B] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1A1A1B]">
                <tr>
                  <th className="text-left p-4 font-semibold">Featured</th>
                  <th className="text-left p-4 font-semibold">Product Name</th>
                  <th className="text-left p-4 font-semibold">SKU</th>
                  <th className="text-left p-4 font-semibold">Price</th>
                  <th className="text-left p-4 font-semibold">Stock</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Images</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: any, index: number) => (
                  <tr
                    key={product.id}
                    className={`border-t border-[#1A1A1B] hover:bg-[#1A1A1B] transition-colors ${
                      index % 2 === 0 ? "bg-[#121213]" : "bg-[#0B0B0C]"
                    }`}
                  >
                    {/* Featured */}
                    <td className="p-4">
                      <FeaturedToggle productId={product.id} featured={product.featured || false} />
                    </td>
                    {/* Product Name */}
                    <td className="p-4">
                      <div className="font-medium flex items-center gap-2">
                        {product.name}
                        {product.featured && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Featured</span>
                        )}
                      </div>
                      {product.short_desc && (
                        <div className="text-xs text-[#BDBDBD] mt-1 line-clamp-1">
                          {product.short_desc}
                        </div>
                      )}
                    </td>
                    {/* SKU */}
                    <td className="p-4">
                      {product.sku ? (
                        <span className="text-xs text-[#BDBDBD] font-mono">{product.sku}</span>
                      ) : (
                        <span className="text-xs text-[#BDBDBD]">-</span>
                      )}
                    </td>
                    {/* Price */}
                    <td className="p-4">
                      {product.sale_price && product.sale_price > 0 ? (
                        <>
                          <div className="font-semibold">PKR {parseFloat(product.sale_price).toFixed(2)}</div>
                          <div className="text-xs text-[#BDBDBD] line-through">
                            PKR {parseFloat(product.price).toFixed(2)}
                          </div>
                        </>
                      ) : (
                        <div className="font-semibold">PKR {parseFloat(product.price).toFixed(2)}</div>
                      )}
                    </td>
                    {/* Stock */}
                    <td className="p-4">
                      <span className={product.stock > 0 ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                        {product.stock || 0}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.status === "PUBLISHED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : product.status === "DRAFT"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    {/* Images */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#BDBDBD]" />
                        <span className="text-sm">{product.image_count || 0}</span>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/categories/${slug}/products/${product.id}/edit`}
                          className="text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
                          categorySlug={slug}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

