import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"
import { sendShippingConfirmationEmail } from "@/lib/email"
import { formatDateTimeInKarachi } from "@/lib/date-utils"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const orderId = params.id
    const body = await request.json()
    const { status, payment_status, tracking_id } = body

    // Validate status if provided
    if (status) {
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }

      // Require tracking_id when marking order as SHIPPED
      if (status === 'SHIPPED' && (!tracking_id || tracking_id.trim() === '')) {
        return NextResponse.json(
          { error: "Tracking ID is required when marking order as SHIPPED" },
          { status: 400 }
        )
      }
    }

    // Validate payment_status if provided
    if (payment_status) {
      const validPaymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']
      if (!validPaymentStatuses.includes(payment_status)) {
        return NextResponse.json(
          { error: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Get current order to check previous status
    const currentOrder = await sql`
      SELECT * FROM orders WHERE id = ${orderId}
    `
    if (currentOrder.length === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const previousStatus = currentOrder[0].status
    const wasShipped = previousStatus === 'SHIPPED'

    // Build update query
    let result: any[]
    
    if (status && payment_status) {
      if (status === 'SHIPPED') {
        result = await sql`
          UPDATE orders
          SET status = ${status}, payment_status = ${payment_status}, tracking_id = ${tracking_id}, updated_at = NOW()
          WHERE id = ${orderId}
          RETURNING *
        `
      } else {
        result = await sql`
          UPDATE orders
          SET status = ${status}, payment_status = ${payment_status}, updated_at = NOW()
          WHERE id = ${orderId}
          RETURNING *
        `
      }
    } else if (status) {
      if (status === 'SHIPPED') {
        result = await sql`
          UPDATE orders
          SET status = ${status}, tracking_id = ${tracking_id}, updated_at = NOW()
          WHERE id = ${orderId}
          RETURNING *
        `
      } else {
        result = await sql`
          UPDATE orders
          SET status = ${status}, updated_at = NOW()
          WHERE id = ${orderId}
          RETURNING *
        `
      }
    } else if (payment_status) {
      result = await sql`
        UPDATE orders
        SET payment_status = ${payment_status}, updated_at = NOW()
        WHERE id = ${orderId}
        RETURNING *
      `
    } else {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const updatedOrder = result[0]

    // Send shipping confirmation email if order was just marked as SHIPPED
    if (status === 'SHIPPED' && !wasShipped && tracking_id) {
      try {
        const shippingAddress = typeof updatedOrder.shipping_address === 'string' 
          ? JSON.parse(updatedOrder.shipping_address) 
          : updatedOrder.shipping_address

        await sendShippingConfirmationEmail({
          orderNumber: updatedOrder.order_number,
          email: updatedOrder.email,
          customerName: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || updatedOrder.email,
          trackingId: tracking_id,
          shippingAddress: shippingAddress,
          shippedDate: formatDateTimeInKarachi(new Date()),
        })
        console.log("✅ Shipping confirmation email sent for order:", updatedOrder.order_number)
      } catch (emailError: any) {
        console.error("❌ Error sending shipping confirmation email:", emailError.message)
        // Don't fail the order update if email fails
      }
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error: any) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update order" },
      { status: 500 }
    )
  }
}

