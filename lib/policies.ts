import { sql } from "@/lib/db"

export const POLICY_DEFAULTS = {
  exchange: {
    titleKey: "policy_exchange_title",
    contentKey: "policy_exchange_content",
    title: "Return & Exchange Policy",
    content: `Eligibility
Items can be returned or exchanged within 7 days of delivery, provided they are unused, unworn, and in their original condition with all tags and packaging intact. Proof of purchase (order number or receipt) is required.

Non-Returnable Items
- Items that have been worn, used, or washed
- Items without original tags or labels
- Items damaged due to misuse or negligence
- Sale or clearance items (unless defective)
- Personalized or customized items

Size & Colour Exchanges
If you need a different size or colour, you can exchange your item for another of the same product, subject to availability. We recommend checking availability before initiating an exchange.

Defective or Damaged Items
If you receive a defective or damaged item, contact us within 48 hours of delivery and we will arrange a replacement or full refund, including return shipping.

How to Request
Contact our support team with your order number to start a return or exchange. Our team will guide you through the next steps.`,
  },
  shipping: {
    titleKey: "policy_shipping_title",
    contentKey: "policy_shipping_content",
    title: "Shipping Policy",
    content: `Processing Time
Orders are processed within 1–2 business days. Orders placed on weekends or public holidays are processed on the next business day.

Delivery Timelines
- Standard delivery: 3–5 business days within Pakistan
- Remote areas may require additional time
- You will receive a tracking update once your order ships

Shipping Charges
Shipping charges are calculated at checkout based on your location. Any applicable promotions or free-shipping thresholds are reflected in your order total.

Order Tracking
Once dispatched, you will receive tracking details via email or WhatsApp. For any delivery queries, please contact our support team.`,
  },
} as const

export async function getPolicy(which: "exchange" | "shipping") {
  const def = POLICY_DEFAULTS[which]
  try {
    const rows = await sql`
      SELECT key, value FROM settings WHERE key IN (${def.titleKey}, ${def.contentKey})
    `
    const map: Record<string, string> = {}
    for (const r of rows as any[]) map[r.key] = r.value
    return {
      title: map[def.titleKey]?.trim() || def.title,
      content: map[def.contentKey]?.trim() || def.content,
    }
  } catch {
    return { title: def.title, content: def.content }
  }
}
