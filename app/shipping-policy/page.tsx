import { Metadata } from "next"
import { getPolicy } from "@/lib/policies"
import { PolicyView } from "@/components/policy-view"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Shipping Policy | Zarge",
  description: "Zarge's shipping methods, timelines, and charges.",
}

export default async function ShippingPolicyPage() {
  const { title, content } = await getPolicy("shipping")
  return <PolicyView title={title} content={content} />
}
