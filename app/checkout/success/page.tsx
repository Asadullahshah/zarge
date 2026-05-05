import { sql } from "@/lib/db"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"
import Stripe from "stripe"

async function getOrderFromStripeSession(sessionId: string) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY not configured")
      return null
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia" as any,
    })

    // Fetch the Stripe checkout session to get order number from metadata
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.metadata?.orderNumber) {
      const order = await sql`
        SELECT * FROM orders WHERE order_number = ${session.metadata.orderNumber}
      `
      if (order.length > 0) {
        return order[0]
      }
    }

    // If order not found by order number, try to find by payment intent
    if (session.payment_intent) {
      const order = await sql`
        SELECT * FROM orders WHERE payment_intent_id = ${session.payment_intent as string}
      `
      if (order.length > 0) {
        return order[0]
      }
    }

    return null
  } catch (error: any) {
    console.error("Error fetching order from Stripe session:", error.message)
    return null
  }
}

async function getOrder(sessionId?: string, orderNumber?: string) {
  // If session_id is provided, fetch from Stripe first
  if (sessionId) {
    const order = await getOrderFromStripeSession(sessionId)
    if (order) {
      return order
    }
    
    // Fallback: try direct lookup by payment_intent_id (legacy)
    const orderByPaymentIntent = await sql`
      SELECT * FROM orders WHERE payment_intent_id = ${sessionId}
    `
    if (orderByPaymentIntent.length > 0) {
      return orderByPaymentIntent[0]
    }
  }
  
  if (orderNumber) {
    const order = await sql`
      SELECT * FROM orders WHERE order_number = ${orderNumber}
    `
    if (order.length > 0) {
      return order[0]
    }
  }

  return null
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; order_number?: string }
}) {
  if (!searchParams.session_id && !searchParams.order_number) {
    notFound()
  }

  const order = await getOrder(searchParams.session_id, searchParams.order_number)

  // If order not found, show a pending message instead of 404
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-6 text-primary animate-pulse" />
          <h1 className="text-4xl font-serif font-bold mb-4">Processing Your Order</h1>
          <p className="text-lg text-[#BDBDBD] mb-2">
            Thank you for your purchase!
          </p>
          <p className="text-[#BDBDBD] mb-8">
            We&apos;re processing your payment. You&apos;ll receive a confirmation email shortly.
          </p>
          <p className="text-sm text-[#BDBDBD] mb-4">
            If you don&apos;t receive an email within a few minutes, please contact us.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">Contact Support</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <CheckCircle className="w-16 h-16 mx-auto mb-6 text-primary" />
        <h1 className="text-4xl font-serif font-bold mb-4">Order Confirmed!</h1>
        <p className="text-lg text-[#BDBDBD] mb-2">
          Thank you for your purchase.
        </p>
        <p className="text-[#BDBDBD] mb-8">
          Your order number is <span className="font-semibold text-[#F7F7F7]">{order.order_number}</span>
        </p>
        <p className="text-sm text-[#BDBDBD] mb-4">
          We&apos;ve sent a confirmation email to {order.email} with your order details.
        </p>
        {order.payment_method === "COD" && (
          <p className="text-sm text-yellow-400 mb-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <strong>Cash on Delivery:</strong> Please have the exact amount ready when your order arrives. 
            Our delivery person will collect the payment upon delivery.
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
          <Link href={`/orders/${order.order_number}`}>
            <Button variant="outline">View Order</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

