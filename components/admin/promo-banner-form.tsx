"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2 } from "lucide-react"

interface PromoBannerFormProps {
  initialEnabled: boolean
  initialMessage: string
}

export function PromoBannerForm({ initialEnabled, initialMessage }: PromoBannerFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [message, setMessage] = useState(initialMessage)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const res = await fetch("/api/admin/promo-banner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled, message }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save promo banner")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#121213] p-6 rounded-lg border border-[#1A1A1B]">
      <h2 className="text-2xl font-serif font-bold mb-2">Promo Banner</h2>
      <p className="text-sm text-[#BDBDBD] mb-6">
        Site-wide banner shown directly below the navbar.
      </p>

      {error && (
        <div className="mb-4 bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <label className="flex items-center gap-4 p-4 rounded-lg border border-[#1A1A1B] cursor-pointer hover:border-primary transition-colors mb-4">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-5 h-5 accent-[#B8960C]"
        />
        <span className="font-semibold">Banner enabled</span>
      </label>

      <Label htmlFor="bannerMessage">Banner message</Label>
      <textarea
        id="bannerMessage"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        className="mt-1 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
      />

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Banner"
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
