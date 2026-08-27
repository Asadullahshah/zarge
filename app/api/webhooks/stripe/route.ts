import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import Stripe from "stripe"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { formatDateTimeInKarachi } from "@/lib/date-utils"

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia" as any,
    })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  console.log("🔔 [WEBHOOK] Received webhook request")
  
  // Check configuration
  if (!stripe) {
    console.error("❌ [WEBHOOK] Stripe not configured - STRIPE_SECRET_KEY is missing")
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  if (!webhookSecret || webhookSecret.trim() === '') {
    console.error("❌ [WEBHOOK] STRIPE_WEBHOOK_SECRET is not configured or is empty")
    console.error("⚠️ [WEBHOOK] Webhooks will not work without a webhook secret!")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    console.error("❌ [WEBHOOK] No stripe-signature header found")
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log("✅ [WEBHOOK] Signature verified. Event type:", event.type)
  } catch (err: any) {
    console.error("❌ [WEBHOOK] Signature verification failed:", err.message)
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("💳 [WEBHOOK] Processing checkout.session.completed event")
        const session = event.data.object as Stripe.Checkout.Session

        console.log("📋 [WEBHOOK] Session details:", {
          id: session.id,
          payment_status: session.payment_status,
          customer_email: session.customer_email,
          metadata_keys: Object.keys(session.metadata || {}),
        })

        // Only process if payment was successful (check both lowercase and case-insensitive)
        if (session.payment_status?.toLowerCase() !== "paid") {
          console.log("⚠️ [WEBHOOK] Payment not completed. Status:", session.payment_status)
          console.log("⚠️ [WEBHOOK] Skipping order creation - payment not successful")
          return NextResponse.json({ received: true, skipped: "Payment not completed" })
        }
        
        console.log("✅ [WEBHOOK] Payment confirmed as PAID. Proceeding with order creation...")

        // Check if metadata exists
        if (!session.metadata?.orderNumber) {
          console.error("❌ [WEBHOOK] No orderNumber in session metadata!")
          console.error("❌ [WEBHOOK] Available metadata keys:", Object.keys(session.metadata || {}))
          return NextResponse.json({ received: true, error: "No orderNumber in metadata" })
        }

        const metadata = session.metadata
        console.log("📦 [WEBHOOK] Creating order from metadata. Order Number:", metadata.orderNumber)

        try {
          // Parse order data from metadata
          let shippingAddress
          let billingAddress
          let orderItems

          try {
            shippingAddress = JSON.parse(metadata.shippingAddress || '{}')
            billingAddress = metadata.billingAddress ? JSON.parse(metadata.billingAddress) : null
            orderItems = JSON.parse(metadata.orderItems || '[]')
            console.log("✅ [WEBHOOK] Metadata parsed successfully")
            console.log("📦 [WEBHOOK] Order items count:", orderItems.length)
          } catch (parseError: any) {
            console.error("❌ [WEBHOOK] Error parsing metadata JSON:", parseError.message)
            console.error("❌ [WEBHOOK] Metadata that failed to parse:", metadata)
            throw new Error(`Failed to parse metadata: ${parseError.message}`)
          }

          // Check if order already exists (to prevent duplicates from webhook retries)
          console.log("🔍 [WEBHOOK] Checking if order already exists...")
          const existingOrder = await sql`
            SELECT id FROM orders WHERE order_number = ${metadata.orderNumber}
          `
          
          let orderData: any
          if (existingOrder.length > 0) {
            console.log("⚠️ [WEBHOOK] Order already exists! Order ID:", existingOrder[0].id)
            console.log("⚠️ [WEBHOOK] This might be a webhook retry. Skipping order creation.")
            
            // Update payment status to PAID (ALWAYS for Stripe orders - they only exist if payment succeeded)
            await sql`
              UPDATE orders 
              SET payment_status = 'PAID', 
                  payment_intent_id = ${session.payment_intent as string || null},
                  updated_at = NOW()
              WHERE order_number = ${metadata.orderNumber}
            `
            console.log("✅ [WEBHOOK] Updated existing order payment status to PAID")
            
            // Get the existing order
            const updatedOrder = await sql`
              SELECT * FROM orders WHERE order_number = ${metadata.orderNumber}
            `
            orderData = updatedOrder[0]
          } else {
            // Create order in database (ONLY AFTER successful payment)
            console.log("💾 [WEBHOOK] Inserting order into database...")
            const order = await sql`
              INSERT INTO orders (
                order_number, email, phone, status, payment_status,
                subtotal, tax, shipping, total, currency,
                shipping_address, billing_address, payment_method, payment_intent_id
              ) VALUES (
                ${metadata.orderNumber}, 
                ${metadata.email}, 
                ${metadata.phone || null}, 
                'PROCESSING', 
                'PAID',
                ${parseFloat(metadata.subtotal || '0')}, 
                ${parseFloat(metadata.tax || '0')}, 
                ${parseFloat(metadata.shipping || '0')}, 
                ${parseFloat(metadata.total || '0')}, 
                'PKR',
                ${JSON.stringify(shippingAddress)}::jsonb, 
                ${billingAddress ? JSON.stringify(billingAddress) : null}::jsonb, 
                'STRIPE',
                ${session.payment_intent as string || null}
              ) RETURNING *
            `

            orderData = order[0]
            console.log("✅ [WEBHOOK] Order created successfully! Order ID:", orderData.id)
          }

          // Check if order items already exist (to prevent duplicates on webhook retry)
          const existingItems = await sql`
            SELECT COUNT(*) as count FROM order_items WHERE order_id = ${orderData.id}
          `
          const itemCount = parseInt(existingItems[0]?.count || '0')
          
          // Only create order items if they don't already exist
          if (itemCount === 0) {
            // Create order items
            console.log("📝 [WEBHOOK] Creating order items...")
            for (const itemData of orderItems) {
              try {
                await sql`
                  INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, size, color)
                  VALUES (
                    ${orderData.id}, 
                    ${itemData.product_id}, 
                    ${itemData.variant_id || null}, 
                    ${itemData.quantity}, 
                    ${itemData.price}, 
                    ${itemData.size || null}, 
                    ${itemData.color || null}
                  )
                `
                console.log(`  ✓ [WEBHOOK] Added order item: ${itemData.product_name || itemData.product_id}`)
              } catch (itemError: any) {
                console.error(`❌ [WEBHOOK] Error creating order item:`, itemError.message)
                throw itemError
              }
            }
            console.log("✅ [WEBHOOK] All order items created")
          } else {
            console.log(`ℹ️ [WEBHOOK] Order items already exist (${itemCount} items). Skipping item creation.`)
          }

          // Clear cart after successful order creation
          if (metadata.cartId) {
            console.log("🗑️ [WEBHOOK] Clearing cart:", metadata.cartId)
            await sql`DELETE FROM cart_items WHERE cart_id = ${metadata.cartId}`
            await sql`DELETE FROM carts WHERE id = ${metadata.cartId}`
            console.log("✅ [WEBHOOK] Cart cleared")
          }

          // Fetch product names and images for email
          console.log("📧 [WEBHOOK] Preparing email data...")
          const orderItemsWithNames = await Promise.all(
            orderItems.map(async (itemData: any) => {
              let productName = itemData.product_name
              let productImageUrl: string | undefined = undefined

              // Fetch product details from database if not in metadata
              if (!productName) {
                const product = await sql`
                  SELECT name FROM products WHERE id = ${itemData.product_id}
                `
                productName = product[0]?.name || 'Product'
              }

              // Fetch product image
              const productImage = await sql`
                SELECT url FROM product_images 
                WHERE product_id = ${itemData.product_id} AND is_primary = true
                ORDER BY "order" ASC
                LIMIT 1
              `
              
              if (productImage.length > 0) {
                productImageUrl = productImage[0].url
              }

              return {
                name: productName,
                quantity: itemData.quantity,
                price: itemData.price,
                size: itemData.size || undefined,
                color: itemData.color || undefined,
                imageUrl: productImageUrl,
              }
            })
          )

          // Send order confirmation email (with retry logic built-in)
          console.log("📧 [WEBHOOK] Sending order confirmation email to:", metadata.email)
          try {
            const emailSent = await sendOrderConfirmationEmail({
              orderNumber: metadata.orderNumber,
              email: metadata.email,
              customerName: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || metadata.email,
              orderItems: orderItemsWithNames,
              subtotal: parseFloat(metadata.subtotal || '0'),
              tax: parseFloat(metadata.tax || '0'),
              shipping: parseFloat(metadata.shipping || '0'),
              total: parseFloat(metadata.total || '0'),
              currency: 'PKR',
              shippingAddress: shippingAddress,
              paymentMethod: 'STRIPE',
              orderDate: formatDateTimeInKarachi(new Date()),
            })
            
            if (emailSent) {
              console.log("✅ [WEBHOOK] Order confirmation email sent successfully!")
            } else {
              console.error("❌ [WEBHOOK] Failed to send order confirmation email after retries")
            }
          } catch (emailError: any) {
            console.error("❌ [WEBHOOK] Error sending order confirmation email:", emailError.message)
            console.error("❌ [WEBHOOK] Email error stack:", emailError.stack)
            // Don't fail the webhook if email fails
          }

          console.log("✅ [WEBHOOK] Order processing completed successfully!")
        } catch (orderError: any) {
          console.error("❌ [WEBHOOK] Error creating order:", orderError.message)
          console.error("❌ [WEBHOOK] Order error stack:", orderError.stack)
          throw orderError
        }
        break
      }

      case "payment_intent.succeeded": {
        console.log("💳 [WEBHOOK] Payment intent succeeded (already handled by checkout.session.completed)")
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("❌ [WEBHOOK] Payment failed for payment intent:", paymentIntent.id)
        break
      }

      default:
        console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("❌ [WEBHOOK] Webhook handler error:", error.message)
    console.error("❌ [WEBHOOK] Error stack:", error.stack)
    return NextResponse.json(
      { error: "Webhook handler failed", message: error.message },
      { status: 500 }
    )
  }
}
