import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { formatDateInKarachi, formatDateTimeInKarachi } from "@/lib/date-utils"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { OrderStatusUpdate } from "@/components/admin/order-status-update"

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAuth()

  const orderId = params.id

  // Get order details
  const orders = await sql`
    SELECT * FROM orders WHERE id = ${orderId}
  `

  if (orders.length === 0) {
    return (
      <div>
        <Link href="/admin/orders" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Orders
        </Link>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-[#BDBDBD]">The order you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  const order = orders[0] as any

  // Get order items with product details
  const orderItems = await sql`
    SELECT 
      oi.*,
      p.name as product_name,
      p.slug as product_slug,
      p.price as product_price,
      p.sale_price as product_sale_price,
      pi.url as product_image_url
    FROM order_items oi
    INNER JOIN products p ON oi.product_id = p.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
    WHERE oi.order_id = ${orderId}
    ORDER BY oi.created_at
  `

  const shippingAddress = typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : order.shipping_address

  const billingAddress = order.billing_address 
    ? (typeof order.billing_address === 'string' 
        ? JSON.parse(order.billing_address) 
        : order.billing_address)
    : null

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
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold">Order Details</h1>
          <p className="text-[#BDBDBD] mt-1">Order #{order.order_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Order Status */}
        <div className="bg-[#121213] p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Order Status</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#BDBDBD] mb-2">Status</p>
              <div className="mb-2">
                <span className={`px-3 py-1 rounded text-sm ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <OrderStatusUpdate
                orderId={order.id}
                currentStatus={order.status}
                type="status"
              />
            </div>
            <div>
              <p className="text-sm text-[#BDBDBD] mb-2">Payment Status</p>
              <div className="mb-2">
                <span className={`px-3 py-1 rounded text-sm ${getPaymentStatusColor(order.payment_status)}`}>
                  {order.payment_status}
                </span>
              </div>
              <OrderStatusUpdate
                orderId={order.id}
                currentPaymentStatus={order.payment_status}
                type="payment_status"
              />
            </div>
            <div>
              <p className="text-sm text-[#BDBDBD] mb-1">Payment Method</p>
              <p className="text-sm">
                <span className={`px-3 py-1 rounded text-sm inline-block ${
                  order.payment_method === "COD" 
                    ? "bg-orange-500/20 text-orange-400" 
                    : "bg-blue-500/20 text-blue-400"
                }`}>
                  {order.payment_method || "STRIPE"}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-[#BDBDBD] mb-1">Order Date & Time</p>
              <p className="text-sm text-[#F7F7F7]">
                {formatDateInKarachi(order.created_at, "MMM d, yyyy")}
              </p>
              <p className="text-sm text-[#BDBDBD]">
                {formatDateInKarachi(order.created_at, "h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#BDBDBD] mb-1">Last Updated</p>
              <p className="text-sm text-[#F7F7F7]">
                {formatDateInKarachi(order.updated_at, "MMM d, yyyy")}
              </p>
              <p className="text-sm text-[#BDBDBD]">
                {formatDateInKarachi(order.updated_at, "h:mm a")}
              </p>
            </div>
            {order.tracking_id && (
              <div>
                <p className="text-sm text-[#BDBDBD] mb-1">Tracking Number</p>
                <p className="text-sm text-[#F7F7F7] font-mono">{order.tracking_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-[#121213] p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-[#BDBDBD]">Email</p>
              <p>{order.email}</p>
            </div>
            {order.phone && (
              <div>
                <p className="text-[#BDBDBD]">Phone</p>
                <p>{order.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-[#121213] p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#BDBDBD]">Subtotal</span>
              <span>{formatPrice(parseFloat(order.subtotal))}</span>
            </div>
            {parseFloat(order.tax) > 0 && (
              <div className="flex justify-between">
                <span className="text-[#BDBDBD]">Tax</span>
                <span>{formatPrice(parseFloat(order.tax))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#BDBDBD]">Shipping</span>
              <span className={parseFloat(order.shipping) > 0 ? "" : "text-green-400"}>
                {parseFloat(order.shipping) > 0 ? formatPrice(parseFloat(order.shipping)) : "Free"}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#1A1A1B] font-semibold">
              <span>Total</span>
              <span>{formatPrice(parseFloat(order.total))}</span>
            </div>
            <div className="pt-2">
              <p className="text-[#BDBDBD]">Currency</p>
              <p>{order.currency || "PKR"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-[#121213] rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {orderItems.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-[#1A1A1B] last:border-0 last:pb-0">
              {item.product_image_url && (
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image
                    src={item.product_image_url}
                    alt={item.product_name}
                    fill
                    sizes="80px"
                    className="object-cover rounded-md"
                  />
                </div>
              )}
              <div className="flex-1">
                <Link
                  href={`/product/${item.product_slug}`}
                  className="font-semibold hover:text-primary transition-colors"
                >
                  {item.product_name}
                </Link>
                <div className="text-sm text-[#BDBDBD] mt-1">
                  <span>Quantity: {item.quantity}</span>
                  {item.size && <span className="ml-4">Size: {item.size}</span>}
                  {item.color && <span className="ml-4">Color: {item.color}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(parseFloat(item.price))}</p>
                <p className="text-sm text-[#BDBDBD]">
                  {formatPrice(parseFloat(item.price) * item.quantity)} total
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping Address */}
        <div className="bg-[#121213] p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
          <div className="text-sm space-y-1">
            <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
            <p>{shippingAddress.address}</p>
            <p>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
            </p>
            <p>{shippingAddress.country}</p>
          </div>
        </div>

        {/* Billing Address */}
        {billingAddress && (
          <div className="bg-[#121213] p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Billing Address</h2>
            <div className="text-sm space-y-1">
              <p>{billingAddress.firstName} {billingAddress.lastName}</p>
              <p>{billingAddress.address}</p>
              <p>
                {billingAddress.city}, {billingAddress.state} {billingAddress.zipCode}
              </p>
              <p>{billingAddress.country}</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Intent ID */}
      {order.payment_intent_id && (
        <div className="bg-[#121213] p-6 rounded-lg mt-6">
          <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
          <div className="text-sm">
            <p className="text-[#BDBDBD] mb-1">Payment Intent ID</p>
            <p className="font-mono">{order.payment_intent_id}</p>
          </div>
        </div>
      )}
    </div>
  )
}

