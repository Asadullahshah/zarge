/**
 * WhatsApp utility for sending order notifications
 * Uses Meta's WhatsApp Cloud API (requires WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID)
 */

import { buildOrderVars, getNotificationConfig, renderTemplate } from "./notifications"

const GRAPH_API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0"

// Low-level send: posts a free-form text message to a phone number via the Cloud API.
// Note: outside Meta's 24-hour customer service window, WhatsApp only allows pre-approved
// message templates for business-initiated messages - a plain text send like this may be
// rejected by the API until the customer has messaged the business number first.
export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken) {
      console.warn("⚠️ WHATSAPP_ACCESS_TOKEN is not configured. WhatsApp message will not be sent.")
      return false
    }

    if (!phoneNumberId) {
      console.warn("⚠️ WHATSAPP_PHONE_NUMBER_ID is not configured. WhatsApp message will not be sent.")
      return false
    }

    const digits = (to || "").replace(/\D/g, "")
    if (!digits) {
      console.warn("⚠️ No valid recipient phone number provided for WhatsApp message.")
      return false
    }

    console.log("💬 Sending WhatsApp message to:", digits)

    // Retry logic: Try up to 3 times with exponential backoff
    const maxRetries = 3
    let lastError: any = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: digits,
              type: "text",
              text: { body: text, preview_url: false },
            }),
          }
        )

        const result = await response.json().catch(() => null)

        if (response.ok) {
          console.log(`✅ WhatsApp message sent successfully to: ${digits} (attempt ${attempt}/${maxRetries})`)
          return true
        }

        lastError = result?.error || { message: response.statusText }
        console.warn(`⚠️ WhatsApp API returned an error (attempt ${attempt}/${maxRetries}):`, lastError)
      } catch (error: any) {
        lastError = error
        console.error(`❌ WhatsApp sending error (attempt ${attempt}/${maxRetries}):`, error?.message || error)
      }

      // If not the last attempt, wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }

    console.error(`❌ Failed to send WhatsApp message after ${maxRetries} attempts to:`, digits)
    if (lastError) {
      console.error("❌ Last error:", lastError.message || lastError)
    }

    return false
  } catch (error: any) {
    console.error("❌ Error sending WhatsApp message:", error?.message || error)
    console.error("Error details:", error)
    return false
  }
}

// High-level helper: renders the "order_placed" template from the notification config
// and sends it to the order's phone number. Mirrors sendOrderConfirmationEmail in lib/email.ts.
export async function sendOrderConfirmationWhatsApp(
  order: any,
  items: Array<{ name: string; quantity: number }> = []
): Promise<boolean> {
  if (!order?.phone) {
    return false
  }

  const config = await getNotificationConfig()
  const template = config.events.order_placed

  if (!template?.whatsappEnabled) {
    console.log("ℹ️ WhatsApp order confirmation is disabled in notification settings. Skipping.")
    return false
  }

  const vars = buildOrderVars(order, items, config.senderName)
  const text = renderTemplate(template.whatsappText, vars)

  return sendWhatsAppMessage(order.phone, text)
}
