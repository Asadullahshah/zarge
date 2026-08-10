/**
 * Email utility for sending order confirmations
 * Uses Resend API (recommended) or can be configured with other services
 */

import { formatDateTimeInKarachi } from "./date-utils"

interface OrderConfirmationEmailData {
  orderNumber: string
  email: string
  customerName: string
  orderItems: Array<{
    name: string
    quantity: number
    price: number
    size?: string
    color?: string
    imageUrl?: string
  }>
  subtotal: number
  tax: number
  total: number
  currency: string
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  paymentMethod: string
  orderDate: string
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠️ RESEND_API_KEY is not configured. Email will not be sent.")
      console.log("📧 Order Confirmation Email (not sent - configure RESEND_API_KEY):", {
        to: data.email,
        subject: `Order Confirmation - ${data.orderNumber}`,
        orderNumber: data.orderNumber,
      })
      return false
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      console.warn("⚠️ RESEND_FROM_EMAIL is not configured. Using default.")
    }

    console.log("📧 Sending order confirmation email to:", data.email)

    const maxRetries = 3
    let lastError: any = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await sendWithResend(data)

        if (result) {
          console.log(`✅ Order confirmation email sent successfully to: ${data.email} (attempt ${attempt}/${maxRetries})`)
          return true
        } else {
          lastError = new Error("Email sending returned false")
          console.warn(`⚠️ Email send returned false (attempt ${attempt}/${maxRetries})`)
        }
      } catch (error: any) {
        lastError = error
        console.error(`❌ Email sending error (attempt ${attempt}/${maxRetries}):`, error?.message || error)

        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000
          console.log(`⏳ Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    console.error(`❌ Failed to send order confirmation email after ${maxRetries} attempts to:`, data.email)
    if (lastError) {
      console.error("❌ Last error:", lastError.message || lastError)
    }

    return false
  } catch (error: any) {
    console.error("❌ Error sending order confirmation email:", error?.message || error)
    console.error("Error details:", error)
    return false
  }
}

async function sendWithResend(data: OrderConfirmationEmailData): Promise<boolean> {
  try {
    const resend = await import("resend")
    const resendClient = new resend.Resend(process.env.RESEND_API_KEY)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.zargeofficial.com'

    const ensureAbsoluteUrl = (url: string | undefined): string | undefined => {
      if (!url) return undefined
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
    }

    const orderItemsHtml = data.orderItems.map(item => {
      const absoluteImageUrl = ensureAbsoluteUrl(item.imageUrl)
      return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #D9D9D9;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${absoluteImageUrl ? `
            <div style="width: 80px; height: 80px; flex-shrink: 0; border-radius: 6px; overflow: hidden; background-color: #F5F5F5; border: 1px solid #D9D9D9;">
              <img src="${absoluteImageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
            </div>
            ` : ''}
            <div style="flex: 1;">
              <div style="font-weight: 500; margin-bottom: 4px; color: #1D1D20;">${item.name}</div>
              ${item.size ? `<div style="font-size: 13px; color: #575757; margin-top: 4px;">Size: ${item.size}</div>` : ''}
              ${item.color ? `<div style="font-size: 13px; color: #575757; margin-top: 4px;">Color: ${item.color}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #D9D9D9; text-align: center; color: #1D1D20; vertical-align: middle;">${item.quantity}</td>
        <td style="padding: 16px; border-bottom: 1px solid #D9D9D9; text-align: right; color: #1D1D20; font-weight: 500; vertical-align: middle;">PKR ${item.price.toLocaleString()}</td>
      </tr>
      `
    }).join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFFFFF; padding: 0; margin: 0;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #FFFFFF; border: 1px solid #D9D9D9; border-radius: 8px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 30px; text-align: center; background-color: #FFFFFF; border-bottom: 1px solid #D9D9D9;">
                      <div style="margin-bottom: 12px;">
                        <span style="font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 0.06em; color: #CEAD5A; -webkit-font-smoothing: antialiased;">ZARGÉ</span>
                      </div>
                      <p style="margin: 0; font-size: 16px; color: #575757; font-weight: 400; letter-spacing: 0.5px;">ORDER CONFIRMATION</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px; background-color: #FFFFFF;">
                      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #1D1D20;">Dear ${data.customerName},</p>

                      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #575757;">Thank you for your order! We&apos;re excited to confirm that we&apos;ve received your order and payment.</p>

                      <!-- Order Details Card -->
                      <div style="background-color: #F5F5F5; border: 1px solid #D9D9D9; border-radius: 8px; padding: 24px; margin: 30px 0;">
                        <h2 style="margin: 0 0 20px 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 600; color: #1D1D20; border-bottom: 1px solid #D9D9D9; padding-bottom: 12px;">Order Details</h2>
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #575757; font-size: 14px;"><strong style="color: #1D1D20;">Order Number:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #B8960C; font-size: 14px; font-weight: 600;">${data.orderNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #575757; font-size: 14px;"><strong style="color: #1D1D20;">Order Date:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #575757; font-size: 14px;">${data.orderDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #575757; font-size: 14px;"><strong style="color: #1D1D20;">Payment Method:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #575757; font-size: 14px;">${data.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Credit/Debit Card'}</td>
                          </tr>
                        </table>
                      </div>

                      <!-- Order Items -->
                      <h3 style="margin: 40px 0 20px 0; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #1D1D20;">Order Items</h3>
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFFFFF; border: 1px solid #D9D9D9; border-radius: 8px; overflow: hidden;">
                        <thead>
                          <tr style="background-color: #F5F5F5;">
                            <th style="padding: 16px; text-align: left; border-bottom: 2px solid #D9D9D9; color: #1D1D20; font-weight: 600; font-size: 14px;">Item</th>
                            <th style="padding: 16px; text-align: center; border-bottom: 2px solid #D9D9D9; color: #1D1D20; font-weight: 600; font-size: 14px; width: 100px;">Quantity</th>
                            <th style="padding: 16px; text-align: right; border-bottom: 2px solid #D9D9D9; color: #1D1D20; font-weight: 600; font-size: 14px; width: 120px;">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${orderItemsHtml}
                        </tbody>
                      </table>

                      <!-- Order Summary -->
                      <div style="margin-top: 30px; padding-top: 24px; border-top: 2px solid #D9D9D9;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #575757; font-size: 14px;"><strong style="color: #1D1D20;">Subtotal:</strong></td>
                            <td style="text-align: right; padding: 8px 0; color: #575757; font-size: 14px;">PKR ${data.subtotal.toLocaleString()}</td>
                          </tr>
                          ${data.tax > 0 ? `
                          <tr>
                            <td style="padding: 8px 0; color: #575757; font-size: 14px;">Tax:</td>
                            <td style="text-align: right; padding: 8px 0; color: #575757; font-size: 14px;">PKR ${data.tax.toLocaleString()}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #575757; font-size: 14px;">Shipping:</td>
                            <td style="text-align: right; padding: 8px 0; color: #575757; font-size: 14px;">Free</td>
                          </tr>
                          <tr style="font-size: 18px; font-weight: bold;">
                            <td style="padding: 16px 0 8px 0; border-top: 2px solid #D9D9D9; color: #1D1D20; font-size: 18px;"><strong>Total:</strong></td>
                            <td style="text-align: right; padding: 16px 0 8px 0; border-top: 2px solid #D9D9D9; color: #B8960C; font-size: 18px; font-weight: 700;">PKR ${data.total.toLocaleString()}</td>
                          </tr>
                        </table>
                      </div>

                      <!-- Shipping Address -->
                      <div style="background-color: #F5F5F5; border: 1px solid #D9D9D9; border-radius: 8px; padding: 24px; margin: 40px 0;">
                        <h3 style="margin: 0 0 16px 0; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #1D1D20;">Shipping Address</h3>
                        <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #575757;">
                          ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
                          ${data.shippingAddress.address}<br>
                          ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br>
                          ${data.shippingAddress.country}
                        </p>
                      </div>

                      ${data.paymentMethod === 'COD' ? `
                      <div style="background-color: rgba(206, 173, 90, 0.12); border: 1px solid rgba(206, 173, 90, 0.35); border-radius: 8px; padding: 16px; margin: 30px 0;">
                        <p style="margin: 0; color: #8A6D1E; font-size: 14px; line-height: 1.6;"><strong>Cash on Delivery:</strong> Please have the exact amount ready when your order arrives. Our delivery person will collect the payment upon delivery.</p>
                      </div>
                      ` : ''}

                      <p style="margin: 30px 0 20px 0; font-size: 14px; line-height: 1.6; color: #575757;">We&apos;ll send you another email when your order ships.</p>

                      <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #575757;">If you have any questions, please contact us at <a href="mailto:info@zargeofficial.com" style="color: #B8960C; text-decoration: none; font-weight: 500;">info@zargeofficial.com</a></p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: #F5F5F5; border-top: 1px solid #D9D9D9;">
                      <p style="margin: 0 0 12px 0; color: #575757; font-size: 13px; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #1D1D20; font-weight: 600;">Zargé</strong>
                      </p>
                      <p style="margin: 16px 0 0 0;">
                        <a href="https://www.zargeofficial.com" style="color: #B8960C; text-decoration: none; font-size: 14px; font-weight: 500;">www.zargeofficial.com</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    const fromEmail = process.env.RESEND_FROM_EMAIL || "Zarge <noreply@zargeofficial.com>"

    console.log("📧 Attempting to send email via Resend:", {
      from: fromEmail,
      to: data.email,
      subject: `Order Confirmation - ${data.orderNumber}`,
    })

    const result = await resendClient.emails.send({
      from: fromEmail,
      to: data.email,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: emailHtml,
    })

    if (result.error) {
      console.error("❌ Resend API error:", result.error)
      console.error("Error details:", JSON.stringify(result.error, null, 2))
      return false
    }

    console.log("✅ Order confirmation email sent successfully. Resend email ID:", result.data?.id)
    return true
  } catch (error: any) {
    console.error("❌ Error sending email with Resend:", error?.message || error)
    console.error("Error stack:", error?.stack)
    return false
  }
}

interface ShippingConfirmationEmailData {
  orderNumber: string
  email: string
  customerName: string
  trackingId: string
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  shippedDate: string
}

export async function sendShippingConfirmationEmail(data: ShippingConfirmationEmailData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠️ RESEND_API_KEY is not configured. Email will not be sent.")
      return false
    }

    console.log("📧 Sending shipping confirmation email to:", data.email)

    const maxRetries = 3
    let lastError: any = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await sendShippingEmailWithResend(data)

        if (result) {
          console.log(`✅ Shipping confirmation email sent successfully to: ${data.email} (attempt ${attempt}/${maxRetries})`)
          return true
        } else {
          lastError = new Error("Email sending returned false")
          console.warn(`⚠️ Email send returned false (attempt ${attempt}/${maxRetries})`)
        }
      } catch (error: any) {
        lastError = error
        console.error(`❌ Email sending error (attempt ${attempt}/${maxRetries}):`, error?.message || error)

        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000
          console.log(`⏳ Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    console.error(`❌ Failed to send shipping confirmation email after ${maxRetries} attempts to:`, data.email)
    if (lastError) {
      console.error("❌ Last error:", lastError.message || lastError)
    }

    return false
  } catch (error: any) {
    console.error("❌ Error sending shipping confirmation email:", error?.message || error)
    return false
  }
}

async function sendShippingEmailWithResend(data: ShippingConfirmationEmailData): Promise<boolean> {
  try {
    const resend = await import("resend")
    const resendClient = new resend.Resend(process.env.RESEND_API_KEY)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.zargeofficial.com'

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #FFFFFF; padding: 0; margin: 0;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #FFFFFF; border: 1px solid #D9D9D9; border-radius: 8px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 30px; text-align: center; background-color: #FFFFFF; border-bottom: 1px solid #D9D9D9;">
                      <div style="margin-bottom: 12px;">
                        <span style="font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 0.06em; color: #CEAD5A; -webkit-font-smoothing: antialiased;">ZARGÉ</span>
                      </div>
                      <p style="margin: 0; font-size: 16px; color: #575757; font-weight: 400; letter-spacing: 0.5px;">ORDER SHIPPED</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px; background-color: #FFFFFF;">
                      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #1D1D20;">Dear ${data.customerName},</p>

                      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #575757;">Great news! Your order has been shipped and is on its way to you.</p>

                      <!-- Shipping Details Card -->
                      <div style="background-color: #F5F5F5; border: 1px solid #D9D9D9; border-radius: 8px; padding: 24px; margin: 30px 0;">
                        <h2 style="margin: 0 0 20px 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 600; color: #1D1D20; border-bottom: 1px solid #D9D9D9; padding-bottom: 12px;">Shipping Information</h2>
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #575757; font-size: 14px;"><strong style="color: #1D1D20;">Order Number:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #B8960C; font-size: 14px; font-weight: 600;">${data.orderNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #575757; font-size: 14px;"><strong style="color: #1D1D20;">Tracking Number:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #1D1D20; font-size: 16px; font-weight: 600; font-family: monospace; letter-spacing: 1px;">${data.trackingId}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #575757; font-size: 14px;"><strong style="color: #1D1D20;">Shipped Date:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #575757; font-size: 14px;">${data.shippedDate}</td>
                          </tr>
                        </table>
                      </div>

                      <!-- Shipping Address -->
                      <div style="background-color: #F5F5F5; border: 1px solid #D9D9D9; border-radius: 8px; padding: 24px; margin: 30px 0;">
                        <h3 style="margin: 0 0 16px 0; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #1D1D20;">Shipping Address</h3>
                        <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #575757;">
                          ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
                          ${data.shippingAddress.address}<br>
                          ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br>
                          ${data.shippingAddress.country}
                        </p>
                      </div>

                      <p style="margin: 30px 0 20px 0; font-size: 14px; line-height: 1.6; color: #575757;">You can use your tracking number to track your package&apos;s delivery status.</p>

                      <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #575757;">If you have any questions, please contact us at <a href="mailto:info@zargeofficial.com" style="color: #B8960C; text-decoration: none; font-weight: 500;">info@zargeofficial.com</a></p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: #F5F5F5; border-top: 1px solid #D9D9D9;">
                      <p style="margin: 0 0 12px 0; color: #575757; font-size: 13px; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #1D1D20; font-weight: 600;">Zargé</strong>
                      </p>
                      <p style="margin: 16px 0 0 0;">
                        <a href="https://www.zargeofficial.com" style="color: #B8960C; text-decoration: none; font-size: 14px; font-weight: 500;">www.zargeofficial.com</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    const fromEmail = process.env.RESEND_FROM_EMAIL || "Zarge <noreply@zargeofficial.com>"

    console.log("📧 Attempting to send shipping email via Resend:", {
      from: fromEmail,
      to: data.email,
      subject: `Your Order ${data.orderNumber} Has Shipped`,
    })

    const result = await resendClient.emails.send({
      from: fromEmail,
      to: data.email,
      subject: `Your Order ${data.orderNumber} Has Shipped`,
      html: emailHtml,
    })

    if (result.error) {
      console.error("❌ Resend API error:", result.error)
      console.error("Error details:", JSON.stringify(result.error, null, 2))
      return false
    }

    console.log("✅ Shipping confirmation email sent successfully. Resend email ID:", result.data?.id)
    return true
  } catch (error: any) {
    console.error("❌ Error sending shipping email with Resend:", error?.message || error)
    console.error("Error stack:", error?.stack)
    return false
  }
}