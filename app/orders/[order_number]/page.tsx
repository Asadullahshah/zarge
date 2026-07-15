import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { formatPrice } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react"
import Image from "next/image"

async function getOrder(orderNumber: string) {
  const orders = await sql`
    SELECT * FROM orders WHERE order_number = ${orderNumber}
  `

  if (orders.length === 0) {
    return null
  }

  return orders[0] as any
}

export default async function OrderDetailPage({
  params,
}: {
  params: { order_number: string }
}) {
  const order = await getOrder(params.order_number)

  if (!order) {
    notFound()
  }

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
    WHERE oi.order_id = ${order.id}
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold">Order Details</h1>
          <p className="text-gray-500 mt-1">Order #{order.order_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Order Status */}
        <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Status
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <span className={`px-3 py-1 rounded text-sm ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Payment Status</p>
              <span className={`px-3 py-1 rounded text-sm ${getPaymentStatusColor(order.payment_status)}`}>
                {order.payment_status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Payment Method</p>
              <span className={`px-3 py-1 rounded text-sm inline-block ${
                order.payment_method === "COD" 
                  ? "bg-orange-500/20 text-orange-400" 
                  : "bg-blue-500/20 text-blue-400"
              }`}>
                {order.payment_method || "STRIPE"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Date</p>
              <p className="text-sm">
                {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-500">Email</p>
              <p>{order.email}</p>
            </div>
            {order.phone && (
              <div>
                <p className="text-gray-500">Phone</p>
                <p>{order.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Order Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPrice(parseFloat(order.subtotal))}</span>
            </div>
            {parseFloat(order.tax) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>{formatPrice(parseFloat(order.tax))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
              <span>Total</span>
              <span>{formatPrice(parseFloat(order.total))}</span>
            </div>
            <div className="pt-2">
              <p className="text-gray-500">Currency</p>
              <p>{order.currency || "PKR"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {orderItems.map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
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
                <div className="text-sm text-gray-500 mt-1">
                  <span>Quantity: {item.quantity}</span>
                  {item.size && <span className="ml-4">Size: {item.size}</span>}
                  {item.color && <span className="ml-4">Color: {item.color}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(parseFloat(item.price))}</p>
                <p className="text-sm text-gray-500">
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
        <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Address
          </h2>
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
          <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing Address
            </h2>
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

      {/* COD Notice */}
      {order.payment_method === "COD" && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-yellow-400 mb-2">Cash on Delivery</h3>
          <p className="text-sm text-gray-500">
            Please have the exact amount ready when your order arrives. Our delivery person will collect the payment upon delivery.
          </p>
        </div>
      )}

      {/* Payment Intent ID (for Stripe orders) */}
      {order.payment_intent_id && (
        <div className="bg-white border border-gray-200 shadow-sm p-6 rounded-xl mt-6">
          <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
          <div className="text-sm">
            <p className="text-gray-500 mb-1">Payment Intent ID</p>
            <p className="font-mono">{order.payment_intent_id}</p>
          </div>
        </div>
      )}

      {/* Back to Home */}
      <div className="mt-8 text-center">
        <Link href="/">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  )
}

