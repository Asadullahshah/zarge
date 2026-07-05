import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { formatDateInKarachi, formatDateTimeInKarachi } from "@/lib/date-utils"
import { OrderStatusUpdate } from "@/components/admin/order-status-update"

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string }
}) {
  await requireAuth()

  const page = parseInt(searchParams.page || "1")
  const limit = 20
  const offset = (page - 1) * limit
  const status = searchParams.status

  let orders
  if (status) {
    orders = await sql`
      SELECT * FROM orders
      WHERE status = ${status}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  } else {
    orders = await sql`
      SELECT * FROM orders
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  }

  let countResult
  if (status) {
    countResult = await sql`
      SELECT COUNT(*) as total FROM orders WHERE status = ${status}
    `
  } else {
    countResult = await sql`
      SELECT COUNT(*) as total FROM orders
    `
  }
  const total = parseInt(countResult[0]?.total || "0")
  const totalPages = Math.ceil(total / limit)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400"
      case "PROCESSING":
        return "bg-blue-500/20 text-blue-400"
      case "SHIPPED":
        return "bg-purple-500/20 text-purple-400"
      case "DELIVERED":
        return "bg-green-500/20 text-green-400"
      case "CANCELLED":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-500/20 text-green-400"
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400"
      case "FAILED":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8">Orders</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Link
          href="/admin/orders"
          className={`px-4 py-2 rounded ${
            !status
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/orders?status=PENDING"
          className={`px-4 py-2 rounded ${
            status === "PENDING"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Pending
        </Link>
        <Link
          href="/admin/orders?status=PROCESSING"
          className={`px-4 py-2 rounded ${
            status === "PROCESSING"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Processing
        </Link>
        <Link
          href="/admin/orders?status=SHIPPED"
          className={`px-4 py-2 rounded ${
            status === "SHIPPED"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Shipped
        </Link>
        <Link
          href="/admin/orders?status=DELIVERED"
          className={`px-4 py-2 rounded ${
            status === "DELIVERED"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Delivered
        </Link>
        <Link
          href="/admin/orders?status=CANCELLED"
          className={`px-4 py-2 rounded ${
            status === "CANCELLED"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Cancelled
        </Link>
        <Link
          href="/admin/orders?status=REFUNDED"
          className={`px-4 py-2 rounded ${
            status === "REFUNDED"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Refunded
        </Link>
      </div>

      <div className="bg-[#121213] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1A1A1B]">
            <tr>
              <th className="text-left p-4">Order Number</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Date & Time</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Payment Method</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Payment</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr key={order.id} className="border-t border-[#1A1A1B]">
                <td className="p-4 font-mono text-sm">{order.order_number}</td>
                <td className="p-4">
                  <div>
                    <div>{order.email}</div>
                    {order.phone && (
                      <div className="text-sm text-[#BDBDBD]">{order.phone}</div>
                    )}
                  </div>
                </td>
                <td className="p-4 text-sm">
                  <div className="text-[#F7F7F7]">
                    {formatDateInKarachi(order.created_at, "MMM d, yyyy")}
                  </div>
                  <div className="text-[#BDBDBD] text-xs mt-1">
                    {formatDateInKarachi(order.created_at, "h:mm a")}
                  </div>
                </td>
                <td className="p-4 font-semibold">
                  {formatPrice(parseFloat(order.total))}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded text-sm ${
                    order.payment_method === "COD" 
                      ? "bg-orange-500/20 text-orange-400" 
                      : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {order.payment_method || "STRIPE"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <OrderStatusUpdate
                      orderId={order.id}
                      currentStatus={order.status}
                      type="status"
                      compact
                    />
                    {order.tracking_id && (
                      <div className="text-xs text-[#BDBDBD] mt-1">
                        <span className="font-semibold">Tracking:</span> <span className="font-mono">{order.tracking_id}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <OrderStatusUpdate
                    orderId={order.id}
                    currentStatus={order.payment_status}
                    type="payment_status"
                    compact
                  />
                </td>
                <td className="p-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}${status ? `&status=${status}` : ""}`}
              className="px-4 py-2 rounded border border-[#1A1A1B] text-black"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-[#BDBDBD]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`?page=${page + 1}${status ? `&status=${status}` : ""}`}
              className="px-4 py-2 rounded border border-[#1A1A1B] text-black"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

