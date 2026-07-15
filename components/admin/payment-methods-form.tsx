"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckCircle2, CreditCard, Banknote, Landmark, Loader2 } from "lucide-react"

interface PaymentMethodsFormProps {
  initialSettings: Record<string, string>
}

export function PaymentMethodsForm({ initialSettings }: PaymentMethodsFormProps) {
  const [stripe, setStripe] = useState(initialSettings.payment_stripe_enabled !== "false")
  const [cod, setCod] = useState(initialSettings.payment_cod_enabled !== "false")
  const [bank, setBank] = useState(initialSettings.payment_bank_enabled === "true")
  const [bankDetails, setBankDetails] = useState(initialSettings.payment_bank_details || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const methods = [
    {
      key: "stripe",
      label: "Credit / Debit Card (Stripe)",
      desc: "Online card payments via Stripe.",
      icon: CreditCard,
      value: stripe,
      set: setStripe,
    },
    {
      key: "cod",
      label: "Cash on Delivery (COD)",
      desc: "Customer pays cash when the order is delivered.",
      icon: Banknote,
      value: cod,
      set: setCod,
    },
    {
      key: "bank",
      label: "Bank Transfer / Deposit",
      desc: "Customer transfers to your bank account and the order is confirmed manually.",
      icon: Landmark,
      value: bank,
      set: setBank,
    },
  ]

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
          payment_stripe_enabled: String(stripe),
          payment_cod_enabled: String(cod),
          payment_bank_enabled: String(bank),
          payment_bank_details: bankDetails,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save payment methods")
    } finally {
      setSaving(false)
    }
  }

  const noneEnabled = !stripe && !cod && !bank

  return (
    <div className="bg-[#121213] p-6 rounded-lg border border-[#1A1A1B]">
      <h2 className="text-2xl font-serif font-bold mb-2">Payment Methods</h2>
      <p className="text-sm text-[#BDBDBD] mb-6">
        Enable or disable the payment methods shown at checkout.
      </p>

      {error && (
        <div className="mb-4 bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      {noneEnabled && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/40 text-yellow-500 p-3 rounded-md text-sm">
          At least one payment method should be enabled, or customers won&apos;t be able to check out.
        </div>
      )}

      <div className="space-y-3">
        {methods.map((m) => {
          const Icon = m.icon
          return (
            <label
              key={m.key}
              className="flex items-center gap-4 p-4 rounded-lg border border-[#1A1A1B] cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{m.label}</div>
                <div className="text-sm text-[#BDBDBD]">{m.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={m.value}
                onChange={(e) => m.set(e.target.checked)}
                className="w-5 h-5 accent-[#B8960C]"
              />
            </label>
          )
        })}
      </div>

      {bank && (
        <div className="mt-4">
          <Label htmlFor="bankDetails">Bank Transfer Details (shown to customer)</Label>
          <textarea
            id="bankDetails"
            value={bankDetails}
            onChange={(e) => setBankDetails(e.target.value)}
            rows={4}
            placeholder="Bank: ...&#10;Account title: ...&#10;Account number / IBAN: ..."
            className="mt-1 flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Payment Methods"
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
