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
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠️ RESEND_API_KEY is not configured. Email will not be sent.")
      console.log("📧 Order Confirmation Email (not sent - configure RESEND_API_KEY):", {
        to: data.email,
        subject: `Order Confirmation - ${data.orderNumber}`,
        orderNumber: data.orderNumber,
      })
      return false
    }

    // Check if FROM email is configured
    if (!process.env.RESEND_FROM_EMAIL) {
      console.warn("⚠️ RESEND_FROM_EMAIL is not configured. Using default.")
    }
    
    console.log("📧 Sending order confirmation email to:", data.email)
    
    // Retry logic: Try up to 3 times with exponential backoff
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
        
        // If not the last attempt, wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'
    const logoUrl = `${baseUrl}/img/ICON WHT LOGO TRANSPARANT.png`

    // Helper function to ensure absolute image URL
    const ensureAbsoluteUrl = (url: string | undefined): string | undefined => {
      if (!url) return undefined
      // If already absolute URL (starts with http:// or https://), return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      // If relative URL, prepend base URL
      return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
    }

    const orderItemsHtml = data.orderItems.map(item => {
      const absoluteImageUrl = ensureAbsoluteUrl(item.imageUrl)
      return `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #1A1A1B;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${absoluteImageUrl ? `
            <div style="width: 80px; height: 80px; flex-shrink: 0; border-radius: 6px; overflow: hidden; background-color: #0B0B0C; border: 1px solid #1A1A1B;">
              <img src="${absoluteImageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
            </div>
            ` : ''}
            <div style="flex: 1;">
              <div style="font-weight: 500; margin-bottom: 4px; color: #F7F7F7;">${item.name}</div>
              ${item.size ? `<div style="font-size: 13px; color: #BDBDBD; margin-top: 4px;">Size: ${item.size}</div>` : ''}
              ${item.color ? `<div style="font-size: 13px; color: #BDBDBD; margin-top: 4px;">Color: ${item.color}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #1A1A1B; text-align: center; color: #F7F7F7; vertical-align: middle;">${item.quantity}</td>
        <td style="padding: 16px; border-bottom: 1px solid #1A1A1B; text-align: right; color: #F7F7F7; font-weight: 500; vertical-align: middle;">PKR ${item.price.toLocaleString()}</td>
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
        <body style="margin: 0; padding: 0; background-color: #0B0B0C; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0B0B0C; padding: 0; margin: 0;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #0B0B0C;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 30px; text-align: center; background: linear-gradient(to bottom, #0B0B0C, #121213); border-radius: 8px 8px 0 0;">
                      <div style="margin-bottom: 20px;">
                        <img src="${logoUrl}" alt="House of Noire" style="width: 60px; height: 60px; margin: 0 auto 16px; display: block; object-fit: contain;" />
                        <div style="margin-bottom: 12px;">
                          <span style="font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 0.02em; color: #BFA36A; -webkit-font-smoothing: antialiased;">HOUSE</span>
                          <span style="font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 100; letter-spacing: 0.08em; color: #BFA36A; -webkit-font-smoothing: antialiased; opacity: 0.9;"> NOIRE</span>
                        </div>
                      </div>
                      <p style="margin: 0; font-size: 16px; color: #BDBDBD; font-weight: 400; letter-spacing: 0.5px;">ORDER CONFIRMATION</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px; background-color: #121213; border: 1px solid #1A1A1B; border-top: none;">
                      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #F7F7F7;">Dear ${data.customerName},</p>
                      
                      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #BDBDBD;">Thank you for your order! We&apos;re excited to confirm that we&apos;ve received your order and payment.</p>
                      
                      <!-- Order Details Card -->
                      <div style="background-color: #0B0B0C; border: 1px solid #1A1A1B; border-radius: 8px; padding: 24px; margin: 30px 0;">
                        <h2 style="margin: 0 0 20px 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 600; color: #F7F7F7; border-bottom: 1px solid #1A1A1B; padding-bottom: 12px;">Order Details</h2>
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #BDBDBD; font-size: 14px;"><strong style="color: #F7F7F7;">Order Number:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #BFA36A; font-size: 14px; font-weight: 600;">${data.orderNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #BDBDBD; font-size: 14px;"><strong style="color: #F7F7F7;">Order Date:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #BDBDBD; font-size: 14px;">${data.orderDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #BDBDBD; font-size: 14px;"><strong style="color: #F7F7F7;">Payment Method:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #BDBDBD; font-size: 14px;">${data.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Credit/Debit Card'}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- Order Items -->
                      <h3 style="margin: 40px 0 20px 0; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #F7F7F7;">Order Items</h3>
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0B0B0C; border: 1px solid #1A1A1B; border-radius: 8px; overflow: hidden;">
                        <thead>
                          <tr style="background-color: #121213;">
                            <th style="padding: 16px; text-align: left; border-bottom: 2px solid #1A1A1B; color: #F7F7F7; font-weight: 600; font-size: 14px;">Item</th>
                            <th style="padding: 16px; text-align: center; border-bottom: 2px solid #1A1A1B; color: #F7F7F7; font-weight: 600; font-size: 14px; width: 100px;">Quantity</th>
                            <th style="padding: 16px; text-align: right; border-bottom: 2px solid #1A1A1B; color: #F7F7F7; font-weight: 600; font-size: 14px; width: 120px;">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${orderItemsHtml}
                        </tbody>
                      </table>
                      
                      <!-- Order Summary -->
                      <div style="margin-top: 30px; padding-top: 24px; border-top: 2px solid #1A1A1B;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #BDBDBD; font-size: 14px;"><strong style="color: #F7F7F7;">Subtotal:</strong></td>
                            <td style="text-align: right; padding: 8px 0; color: #BDBDBD; font-size: 14px;">PKR ${data.subtotal.toLocaleString()}</td>
                          </tr>
                          ${data.tax > 0 ? `
                          <tr>
                            <td style="padding: 8px 0; color: #BDBDBD; font-size: 14px;">Tax:</td>
                            <td style="text-align: right; padding: 8px 0; color: #BDBDBD; font-size: 14px;">PKR ${data.tax.toLocaleString()}</td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 8px 0; color: #BDBDBD; font-size: 14px;">Shipping:</td>
                            <td style="text-align: right; padding: 8px 0; color: #BDBDBD; font-size: 14px;">Free</td>
                          </tr>
                          <tr style="font-size: 18px; font-weight: bold;">
                            <td style="padding: 16px 0 8px 0; border-top: 2px solid #1A1A1B; color: #F7F7F7; font-size: 18px;"><strong>Total:</strong></td>
                            <td style="text-align: right; padding: 16px 0 8px 0; border-top: 2px solid #1A1A1B; color: #BFA36A; font-size: 18px; font-weight: 700;">PKR ${data.total.toLocaleString()}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- Shipping Address -->
                      <div style="background-color: #0B0B0C; border: 1px solid #1A1A1B; border-radius: 8px; padding: 24px; margin: 40px 0;">
                        <h3 style="margin: 0 0 16px 0; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #F7F7F7;">Shipping Address</h3>
                        <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #BDBDBD;">
                          ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
                          ${data.shippingAddress.address}<br>
                          ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br>
                          ${data.shippingAddress.country}
                        </p>
                      </div>
                      
                      ${data.paymentMethod === 'COD' ? `
                      <div style="background-color: rgba(191, 163, 106, 0.1); border: 1px solid rgba(191, 163, 106, 0.3); border-radius: 8px; padding: 16px; margin: 30px 0;">
                        <p style="margin: 0; color: #BFA36A; font-size: 14px; line-height: 1.6;"><strong>Cash on Delivery:</strong> Please have the exact amount ready when your order arrives. Our delivery person will collect the payment upon delivery.</p>
                      </div>
                      ` : ''}
                      
                      <p style="margin: 30px 0 20px 0; font-size: 14px; line-height: 1.6; color: #BDBDBD;">We&apos;ll send you another email when your order ships.</p>
                      
                      <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #BDBDBD;">If you have any questions, please contact us at <a href="mailto:info@noirefit.com" style="color: #BFA36A; text-decoration: none; font-weight: 500;">info@noirefit.com</a></p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: #0B0B0C; border: 1px solid #1A1A1B; border-top: none; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0 0 12px 0; padding-top: 20px; border-top: 1px solid #1A1A1B; color: #BDBDBD; font-size: 13px; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #F7F7F7; font-weight: 600;">House of Noire</strong>
                      </p>
                      <p style="margin: 16px 0 0 0;">
                        <a href="https://www.noirefit.com" style="color: #BFA36A; text-decoration: none; font-size: 14px; font-weight: 500;">www.noirefit.com</a>
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

    const fromEmail = process.env.RESEND_FROM_EMAIL || "House of Noire <noreply@noirefit.com>"
    
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
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("⚠️ RESEND_API_KEY is not configured. Email will not be sent.")
      return false
    }

    console.log("📧 Sending shipping confirmation email to:", data.email)
    
    // Retry logic: Try up to 3 times with exponential backoff
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
        
        // If not the last attempt, wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.noirefit.com'
    const logoUrl = `${baseUrl}/img/ICON WHT LOGO TRANSPARANT.png`

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0B0B0C; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0B0B0C; padding: 0; margin: 0;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #0B0B0C;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 30px; text-align: center; background: linear-gradient(to bottom, #0B0B0C, #121213); border-radius: 8px 8px 0 0;">
                      <div style="margin-bottom: 20px;">
                        <img src="${logoUrl}" alt="House of Noire" style="width: 60px; height: 60px; margin: 0 auto 16px; display: block; object-fit: contain;" />
                        <div style="margin-bottom: 12px;">
                          <span style="font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 0.02em; color: #BFA36A; -webkit-font-smoothing: antialiased;">HOUSE</span>
                          <span style="font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 100; letter-spacing: 0.08em; color: #BFA36A; -webkit-font-smoothing: antialiased; opacity: 0.9;"> NOIRE</span>
                        </div>
                      </div>
                      <p style="margin: 0; font-size: 16px; color: #BDBDBD; font-weight: 400; letter-spacing: 0.5px;">ORDER SHIPPED</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px; background-color: #121213; border: 1px solid #1A1A1B; border-top: none;">
                      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #F7F7F7;">Dear ${data.customerName},</p>
                      
                      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #BDBDBD;">Great news! Your order has been shipped and is on its way to you.</p>
                      
                      <!-- Shipping Details Card -->
                      <div style="background-color: #0B0B0C; border: 1px solid #1A1A1B; border-radius: 8px; padding: 24px; margin: 30px 0;">
                        <h2 style="margin: 0 0 20px 0; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 600; color: #F7F7F7; border-bottom: 1px solid #1A1A1B; padding-bottom: 12px;">Shipping Information</h2>
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #BDBDBD; font-size: 14px;"><strong style="color: #F7F7F7;">Order Number:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #BFA36A; font-size: 14px; font-weight: 600;">${data.orderNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #BDBDBD; font-size: 14px;"><strong style="color: #F7F7F7;">Tracking Number:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #F7F7F7; font-size: 16px; font-weight: 600; font-family: monospace; letter-spacing: 1px;">${data.trackingId}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #BDBDBD; font-size: 14px;"><strong style="color: #F7F7F7;">Shipped Date:</strong></td>
                            <td style="padding: 8px 0; text-align: right; color: #BDBDBD; font-size: 14px;">${data.shippedDate}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- Shipping Address -->
                      <div style="background-color: #0B0B0C; border: 1px solid #1A1A1B; border-radius: 8px; padding: 24px; margin: 30px 0;">
                        <h3 style="margin: 0 0 16px 0; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #F7F7F7;">Shipping Address</h3>
                        <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #BDBDBD;">
                          ${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
                          ${data.shippingAddress.address}<br>
                          ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br>
                          ${data.shippingAddress.country}
                        </p>
                      </div>
                      
                      <p style="margin: 30px 0 20px 0; font-size: 14px; line-height: 1.6; color: #BDBDBD;">You can use your tracking number to track your package&apos;s delivery status.</p>
                      
                      <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #BDBDBD;">If you have any questions, please contact us at <a href="mailto:info@noirefit.com" style="color: #BFA36A; text-decoration: none; font-weight: 500;">info@noirefit.com</a></p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: #0B0B0C; border: 1px solid #1A1A1B; border-top: none; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0 0 12px 0; padding-top: 20px; border-top: 1px solid #1A1A1B; color: #BDBDBD; font-size: 13px; line-height: 1.6;">
                        Best regards,<br>
                        <strong style="color: #F7F7F7; font-weight: 600;">House of Noire</strong>
                      </p>
                      <p style="margin: 16px 0 0 0;">
                        <a href="https://www.noirefit.com" style="color: #BFA36A; text-decoration: none; font-size: 14px; font-weight: 500;">www.noirefit.com</a>
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

    const fromEmail = process.env.RESEND_FROM_EMAIL || "House of Noire <noreply@noirefit.com>"
    
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
