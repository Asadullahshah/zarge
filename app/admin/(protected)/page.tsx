import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import { SitemapRegenerator } from "@/components/admin/sitemap-regenerator"

export default async function AdminDashboard() {
  const session = await requireAuth()

  const stats = await sql`
    SELECT 
      (SELECT COUNT(*) FROM products) as total_products,
      (SELECT COUNT(*) FROM products WHERE status = 'PUBLISHED') as published_products,
      (SELECT COUNT(*) FROM orders) as total_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'PENDING') as pending_orders
  `

  const statsData = stats[0] as any

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#121213] p-6 rounded-lg">
          <h3 className="text-[#BDBDBD] text-sm mb-2">Total Products</h3>
          <p className="text-3xl font-bold">{statsData?.total_products || 0}</p>
        </div>
        <div className="bg-[#121213] p-6 rounded-lg">
          <h3 className="text-[#BDBDBD] text-sm mb-2">Published Products</h3>
          <p className="text-3xl font-bold">{statsData?.published_products || 0}</p>
        </div>
        <div className="bg-[#121213] p-6 rounded-lg">
          <h3 className="text-[#BDBDBD] text-sm mb-2">Total Orders</h3>
          <p className="text-3xl font-bold">{statsData?.total_orders || 0}</p>
        </div>
        <div className="bg-[#121213] p-6 rounded-lg">
          <h3 className="text-[#BDBDBD] text-sm mb-2">Pending Orders</h3>
          <p className="text-3xl font-bold">{statsData?.pending_orders || 0}</p>
        </div>
      </div>

      <SitemapRegenerator />
    </div>
  )
}

