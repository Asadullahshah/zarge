"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2 } from "lucide-react"

interface PoliciesFormProps {
  initialSettings: Record<string, string>
  defaults: {
    exchange: { title: string; content: string }
    shipping: { title: string; content: string }
  }
}

export function PoliciesForm({ initialSettings, defaults }: PoliciesFormProps) {
  const [exchangeTitle, setExchangeTitle] = useState(
    initialSettings.policy_exchange_title || defaults.exchange.title
  )
  const [exchangeContent, setExchangeContent] = useState(
    initialSettings.policy_exchange_content || defaults.exchange.content
  )
  const [shippingTitle, setShippingTitle] = useState(
    initialSettings.policy_shipping_title || defaults.shipping.title
  )
  const [shippingContent, setShippingContent] = useState(
    initialSettings.policy_shipping_content || defaults.shipping.content
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          policy_exchange_title: exchangeTitle,
          policy_exchange_content: exchangeContent,
          policy_shipping_title: shippingTitle,
          policy_shipping_content: shippingContent,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save policies")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#BDBDBD]">
        Edit the text shown on your public policy pages. Tip: leave a blank line between sections —
        the first line of each section becomes a heading, and lines starting with{" "}
        <code className="px-1 rounded bg-black/5">- </code> become bullet points.
      </p>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Return & Exchange */}
      <div className="bg-[#121213] p-6 rounded-lg border border-[#1A1A1B] space-y-4">
        <h2 className="text-xl font-serif font-bold">Return &amp; Exchange Policy</h2>
        <div>
          <Label htmlFor="exTitle">Page Title</Label>
          <Input id="exTitle" value={exchangeTitle} onChange={(e) => setExchangeTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="exContent">Content</Label>
          <textarea
            id="exContent"
            value={exchangeContent}
            onChange={(e) => setExchangeContent(e.target.value)}
            rows={14}
            className="mt-1 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-mono leading-relaxed"
          />
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-[#121213] p-6 rounded-lg border border-[#1A1A1B] space-y-4">
        <h2 className="text-xl font-serif font-bold">Shipping Policy</h2>
        <div>
          <Label htmlFor="shTitle">Page Title</Label>
          <Input id="shTitle" value={shippingTitle} onChange={(e) => setShippingTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="shContent">Content</Label>
          <textarea
            id="shContent"
            value={shippingContent}
            onChange={(e) => setShippingContent(e.target.value)}
            rows={14}
            className="mt-1 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-mono leading-relaxed"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
            </>
          ) : (
            "Save Policies"
          )}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-green-500 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </div>
  )
}
