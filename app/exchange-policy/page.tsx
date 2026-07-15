import { Metadata } from "next"
import { getPolicy } from "@/lib/policies"
import { PolicyView } from "@/components/policy-view"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Return & Exchange Policy | Zarge",
  description: "Zarge's return and exchange policy.",
}

export default async function ExchangePolicyPage() {
  const { title, content } = await getPolicy("exchange")
  return <PolicyView title={title} content={content} />
}
