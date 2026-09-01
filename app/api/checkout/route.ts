import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { sendOrderConfirmationWhatsApp } from "@/lib/whatsapp"
import { formatDateTimeInKarachi } from "@/lib/date-utils"
import { generateOrderNumber } from "@/lib/utils"
import { getCheckoutRates } from "@/lib/store-settings"
import { findEnabledDiscountCode, computeDiscountAmount } from "@/lib/discount-codes"

// Only treat Stripe as configured when a real key is present (not the placeholder "sk_test_...")
const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripeConfigured =
  !!stripeSecret && stripeSecret.startsWith("sk_") && !stripeSecret.includes("...")
const stripe = stripeConfigured
  ? new Stripe(stripeSecret!, {
      apiVersion: "2025-02-24.acacia" as any,
    })
  : null

function getSessionId() {
  const cookieStore = cookies()
  return cookieStore.get("cart_session")?.value
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, paymentMethod = "STRIPE", shippingAddress, billingAddress, discountCode } = body

    if ((!email && !phone) || !shippingAddress) {
      return NextResponse.json(
        { error: "An email or phone number, and a shipping address, are required" },
        { status: 400 }
      )
    }

    if (!paymentMethod || !["STRIPE", "COD", "BANK"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method. Must be STRIPE, COD or BANK" },
        { status: 400 }
      )
    }

    const sessionId = getSessionId()
    if (!sessionId) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 400 }
      )
    }

    // Get cart
    const cart = await sql`
      SELECT * FROM carts WHERE session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (cart.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    const cartData = cart[0]

    // Get cart items with product details and images
    const items = await sql`
      SELECT 
        ci.*,
        p.name as product_name,
        p.price as product_price,
        p.sale_price as product_sale_price,
        v.price as variant_price,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true ORDER BY "order" ASC LIMIT 1) as product_image_url
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      LEFT JOIN variants v ON ci.variant_id = v.id
      WHERE ci.cart_id = ${cartData.id}
    `

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    // Calculate totals
    let subtotal = 0
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    const orderItemsData: Array<{
      product_id: string
      product_name: string
      variant_id: string | null
      quantity: number
      price: number
      size: string | null
      color: string | null
    }> = []

    for (const item of items) {
      // Always use sale price if available, otherwise use variant price, then regular price
      const price = parseFloat(
        item.product_sale_price || item.variant_price || item.product_price
      )
      const itemTotal = price * item.quantity
      subtotal += itemTotal

      orderItemsData.push({
        product_id: item.product_id,
        product_name: item.product_name,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        price: price,
        size: item.size || null,
        color: item.color || null,
      })

      // PKR uses 2 decimal places, so multiply by 100 to convert to smallest currency unit
      lineItems.push({
        price_data: {
          currency: "pkr",
          product_data: {
            name: item.product_name,
          },
          unit_amount: Math.round(price * 100), // Convert PKR to smallest unit (multiply by 100)
        },
        quantity: item.quantity,
      })
    }

    // Calculate tax and shipping from admin-configured settings (locked in at order time)
    const { shippingCost, taxRate } = await getCheckoutRates()
    const shipping = shippingCost
    const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100
    const total = subtotal + tax + shipping

    // Discount codes are applied AFTER the total (subtotal + tax + shipping) has been calculated.
    // Re-validate server-side rather than trusting the client - the code may have been disabled
    // or removed since the customer applied it on the checkout page.
    let discountAmount = 0
    let appliedDiscountCode: string | null = null
    if (discountCode) {
      const discount = await findEnabledDiscountCode(discountCode)
      if (discount) {
        discountAmount = computeDiscountAmount(total, discount)
        appliedDiscountCode = discount.code
      }
    }
    const finalTotal = Math.round((total - discountAmount) * 100) / 100

    // Add shipping/tax as their own Stripe line items so the actual charge matches the order total
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: "pkr",
          product_data: {
            name: "Shipping",
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      })
    }
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: "pkr",
          product_data: {
            name: "Tax",
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      })
    }

    // Handle COD / Bank Transfer orders - create order immediately (no online payment)
    if (paymentMethod === "COD" || paymentMethod === "BANK") {
      const orderNumber = generateOrderNumber()
      const order = await sql`
        INSERT INTO orders (
          order_number, email, phone, status, payment_status,
          subtotal, tax, shipping, total, currency,
          shipping_address, billing_address, payment_method,
          discount_code, discount_amount
        ) VALUES (
          ${orderNumber}, ${email}, ${phone || null}, 'PENDING', 'PENDING',
          ${subtotal}, ${tax}, ${shipping}, ${finalTotal}, 'PKR',
          ${JSON.stringify(shippingAddress)}, ${billingAddress ? JSON.stringify(billingAddress) : null}, ${paymentMethod},
          ${appliedDiscountCode}, ${discountAmount}
        ) RETURNING *
      `

      const orderData = order[0]

      // Create order items
      for (const itemData of orderItemsData) {
        await sql`
          INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, size, color)
          VALUES (${orderData.id}, ${itemData.product_id}, ${itemData.variant_id}, ${itemData.quantity}, ${itemData.price}, ${itemData.size}, ${itemData.color})
        `
      }

      // Clear cart
      await sql`DELETE FROM cart_items WHERE cart_id = ${cartData.id}`
      await sql`DELETE FROM carts WHERE id = ${cartData.id}`

      // Send order confirmation email (only when an email was provided)
      if (email) {
        await sendOrderConfirmationEmail({
          orderNumber: orderNumber,
          email: email,
          customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          orderItems: orderItemsData.map((itemData) => {
            const product = items.find((i: any) => i.product_id === itemData.product_id)
            return {
              name: product?.product_name || 'Product',
              quantity: itemData.quantity,
              price: itemData.price,
              size: itemData.size || undefined,
              color: itemData.color || undefined,
              imageUrl: product?.product_image_url || undefined,
            }
          }),
          subtotal: subtotal,
          tax: tax,
          shipping: shipping,
          total: finalTotal,
          discountCode: appliedDiscountCode || undefined,
          discountAmount: discountAmount,
          currency: 'PKR',
          shippingAddress: shippingAddress,
          paymentMethod: paymentMethod,
          orderDate: formatDateTimeInKarachi(new Date()),
        })
      }

      // Send order confirmation WhatsApp message (only when a phone number was provided)
      if (phone) {
        await sendOrderConfirmationWhatsApp(
          orderData,
          orderItemsData.map((itemData) => {
            const product = items.find((i: any) => i.product_id === itemData.product_id)
            return {
              name: product?.product_name || "Product",
              quantity: itemData.quantity,
            }
          })
        )
      }

      return NextResponse.json({
        orderNumber,
        paymentMethod,
      })
    }

    // Handle Stripe orders - DON'T create order yet, only create checkout session
    // Order will be created in webhook AFTER successful payment
    if (!stripe) {
      return NextResponse.json(
        {
          error:
            "Card payment isn't available right now. Please choose Cash on Delivery or Bank Transfer.",
        },
        { status: 400 }
      )
    }

    const orderNumber = generateOrderNumber()

    // Line items sum to the pre-discount total; apply the discount as a Stripe coupon so the
    // actual charge matches finalTotal without needing negative-amount line items.
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined
    if (discountAmount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: "pkr",
        duration: "once",
        name: appliedDiscountCode || "Discount",
      })
      discounts = [{ coupon: coupon.id }]
    }

    // Store order data in metadata to create order after successful payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      discounts,
      success_url: `https://www.zargeofficial.com/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://www.zargeofficial.com/checkout?canceled=true`,
      customer_email: email,
      metadata: {
        orderNumber: orderNumber,
        email: email,
        phone: phone || '',
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddress: billingAddress ? JSON.stringify(billingAddress) : '',
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        shipping: shipping.toString(),
        total: finalTotal.toString(),
        discountCode: appliedDiscountCode || '',
        discountAmount: discountAmount.toString(),
        orderItems: JSON.stringify(orderItemsData),
        cartId: cartData.id,
      },
    })

    // Don't clear cart yet - will be cleared after successful payment in webhook
    // Don't create order yet - will be created after successful payment in webhook

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderNumber,
    })
  } catch (error: any) {
    console.error("Error creating checkout:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
