import { sql } from "@/lib/db"

// ── Types ────────────────────────────────────────────────────────────────
export type NotifyEvent =
  | "order_placed"
  | "status_PROCESSING"
  | "status_SHIPPED"
  | "status_DELIVERED"
  | "status_CANCELLED"
  | "status_REFUNDED"

export interface EventTemplate {
  label: string
  emailEnabled: boolean
  emailSubject: string
  emailBody: string
  whatsappEnabled: boolean
  whatsappText: string
}

export interface NotificationConfig {
  senderName: string
  fromEmail: string // e.g. "orders@yourdomain.com" (must be on a Resend-verified domain)
  events: Record<NotifyEvent, EventTemplate>
}

// ── Defaults ─────────────────────────────────────────────────────────────
const D = (
  label: string,
  emailSubject: string,
  emailBody: string,
  whatsappText: string
): EventTemplate => ({
  label,
  emailEnabled: true,
  emailSubject,
  emailBody,
  whatsappEnabled: true,
  whatsappText,
})

export const NOTIFICATION_DEFAULTS: NotificationConfig = {
  senderName: "Zargé",
  fromEmail: "",
  events: {
    order_placed: D(
      "Order placed",
      "Order Confirmed — {{orderNumber}}",
      "Hi {{customerName}},\n\nThank you for your order {{orderNumber}}! We've received it and will begin processing shortly.\n\nItems: {{items}}\nTotal: {{total}}\n\nTrack your order anytime: {{trackingUrl}}\n\n— {{senderName}}",
      "Hi {{customerName}}! 🎉 Your order {{orderNumber}} is confirmed. Total: {{total}}. Track it here: {{trackingUrl}}"
    ),
    status_PROCESSING: D(
      "Status: Processing",
      "Your order {{orderNumber}} is being prepared",
      "Hi {{customerName}},\n\nGood news — your order {{orderNumber}} is now being prepared for shipment.\n\n— {{senderName}}",
      "Hi {{customerName}}! Your order {{orderNumber}} is now being prepared. 📦"
    ),
    status_SHIPPED: D(
      "Status: Shipped",
      "Your order {{orderNumber}} has shipped 🚚",
      "Hi {{customerName}},\n\nYour order {{orderNumber}} is on its way!\nTracking: {{trackingId}}\n\nView your order: {{trackingUrl}}\n\n— {{senderName}}",
      "Hi {{customerName}}! Your order {{orderNumber}} has shipped 🚚. Tracking: {{trackingId}}"
    ),
    status_DELIVERED: D(
      "Status: Delivered",
      "Your order {{orderNumber}} was delivered",
      "Hi {{customerName}},\n\nYour order {{orderNumber}} has been delivered. We hope you love it! 💛\n\n— {{senderName}}",
      "Hi {{customerName}}! Your order {{orderNumber}} has been delivered. We hope you love it! 💛"
    ),
    status_CANCELLED: D(
      "Status: Cancelled",
      "Your order {{orderNumber}} was cancelled",
      "Hi {{customerName}},\n\nYour order {{orderNumber}} has been cancelled. If this was a mistake or you have questions, please reply to this message.\n\n— {{senderName}}",
      "Hi {{customerName}}, your order {{orderNumber}} has been cancelled. Reply if you have any questions."
    ),
    status_REFUNDED: D(
      "Status: Refunded",
      "Your order {{orderNumber}} has been refunded",
      "Hi {{customerName}},\n\nA refund for order {{orderNumber}} has been processed. It may take a few business days to reflect.\n\n— {{senderName}}",
      "Hi {{customerName}}, a refund for order {{orderNumber}} has been processed. It may take a few business days to reflect."
    ),
  },
}

export const NOTIFY_VARIABLES = [
  "orderNumber",
  "customerName",
  "status",
  "total",
  "items",
  "trackingId",
  "trackingUrl",
  "senderName",
]

// ── Config load / persist ────────────────────────────────────────────────
export async function getNotificationConfig(): Promise<NotificationConfig> {
  try {
    const rows = await sql`SELECT value FROM settings WHERE key = 'notification_config' LIMIT 1`
    if (rows[0]?.value) {
      const parsed = JSON.parse(rows[0].value)
      return {
        senderName: parsed.senderName || NOTIFICATION_DEFAULTS.senderName,
        fromEmail: parsed.fromEmail || NOTIFICATION_DEFAULTS.fromEmail,
        events: { ...NOTIFICATION_DEFAULTS.events, ...(parsed.events || {}) },
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return NOTIFICATION_DEFAULTS
}

// ── Rendering helpers ──────────────────────────────────────────────────────
export function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return (tpl || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "")
}

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  )
}

export function buildOrderVars(
  order: any,
  items: Array<{ name: string; quantity: number }> = [],
  senderName = NOTIFICATION_DEFAULTS.senderName
): Record<string, string> {
  const ship =
    typeof order.shipping_address === "string"
      ? safeParse(order.shipping_address)
      : order.shipping_address || {}
  const name = `${ship.firstName || ""} ${ship.lastName || ""}`.trim()
  const total = `${order.currency || "PKR"} ${Number(order.total || 0).toLocaleString()}`
  return {
    orderNumber: order.order_number || "",
    customerName: name || order.email || "there",
    status: order.status || "",
    total,
    items: items.map((i) => `${i.quantity}× ${i.name}`).join(", "),
    trackingId: order.tracking_id || "",
    trackingUrl: `${baseUrl()}/orders/${order.order_number}`,
    senderName,
  }
}

function safeParse(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}

// Build a wa.me click-to-send link to message a customer number with a prefilled text.
export function buildWhatsappLink(phone: string, text: string): string | null {
  const digits = (phone || "").replace(/\D/g, "")
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

function textToHtml(body: string, senderName: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>")
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.6">
    <div style="padding:24px 8px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1a1a1a">${senderName}</div>
    <div style="padding:8px;font-size:15px">${escaped}</div>
    <div style="padding:24px 8px;border-top:1px solid #eee;margin-top:16px;font-size:12px;color:#888">You're receiving this because you placed an order with ${senderName}.</div>
  </div>`
}

// ── Email (Resend) ─────────────────────────────────────────────────────────
async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  fromName: string
  fromEmail?: string
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not set — notification email not sent:", opts.subject)
    return false
  }
  try {
    const { Resend } = await import("resend")
    const client = new Resend(process.env.RESEND_API_KEY)
    const addr =
      opts.fromEmail ||
      process.env.RESEND_FROM_EMAIL?.replace(/.*<|>.*/g, "") ||
      "onboarding@resend.dev"
    const from = `${opts.fromName} <${addr}>`
    const res = await client.emails.send({ from, to: opts.to, subject: opts.subject, html: opts.html })
    if ((res as any)?.error) {
      console.error("❌ Resend error:", (res as any).error)
      return false
    }
    return true
  } catch (err: any) {
    console.error("❌ Failed to send notification email:", err?.message)
    return false
  }
}

// ── Main dispatch ──────────────────────────────────────────────────────────
// Sends the email (if enabled + email present) and returns a wa.me link the admin
// can click to message the customer (if WhatsApp enabled + phone present).
export async function notifyOrder(
  event: NotifyEvent,
  order: any,
  items: Array<{ name: string; quantity: number }> = []
): Promise<{ emailSent: boolean; whatsappLink: string | null; whatsappText: string | null }> {
  const config = await getNotificationConfig()
  const tpl = config.events[event]
  if (!tpl) return { emailSent: false, whatsappLink: null, whatsappText: null }

  const vars = buildOrderVars(order, items, config.senderName)

  let emailSent = false
  if (tpl.emailEnabled && order.email) {
    emailSent = await sendEmail({
      to: order.email,
      subject: renderTemplate(tpl.emailSubject, vars),
      html: textToHtml(renderTemplate(tpl.emailBody, vars), config.senderName),
      fromName: config.senderName,
      fromEmail: config.fromEmail || undefined,
    })
  }

  let whatsappLink: string | null = null
  let whatsappText: string | null = null
  if (tpl.whatsappEnabled && order.phone) {
    whatsappText = renderTemplate(tpl.whatsappText, vars)
    whatsappLink = buildWhatsappLink(order.phone, whatsappText)
  }

  return { emailSent, whatsappLink, whatsappText }
}

export function eventForStatus(status: string): NotifyEvent | null {
  const map: Record<string, NotifyEvent> = {
    PROCESSING: "status_PROCESSING",
    SHIPPED: "status_SHIPPED",
    DELIVERED: "status_DELIVERED",
    CANCELLED: "status_CANCELLED",
    REFUNDED: "status_REFUNDED",
  }
  return map[status] || null
}
