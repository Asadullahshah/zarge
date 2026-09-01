"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tag, AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react"

type DiscountType = "PERCENTAGE" | "FIXED"

interface DiscountCodeRow {
  id: string
  code: string
  type: DiscountType
  value: string | number
  enabled: boolean
  created_at: string
}

export function DiscountCodesManager() {
  const [codes, setCodes] = useState<DiscountCodeRow[]>([])
  const [listLoading, setListLoading] = useState(true)

  const [code, setCode] = useState("")
  const [type, setType] = useState<DiscountType>("PERCENTAGE")
  const [value, setValue] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCodes = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await fetch("/api/admin/discount-codes", { credentials: "include" })
      const data = await res.json()
      if (res.ok) setCodes(data.discountCodes || [])
    } catch {
      /* ignore */
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  const handleCreate = async () => {
    setError("")
    setSuccess("")

    const parsedValue = parseFloat(value)
    if (!code.trim()) {
      setError("Please enter a code")
      return
    }
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      setError("Please enter a valid positive value")
      return
    }
    if (type === "PERCENTAGE" && parsedValue > 100) {
      setError("Percentage cannot exceed 100")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: code.trim(), type, value: parsedValue, enabled: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create discount code")
      }

      setSuccess(`Discount code "${data.discountCode.code}" created`)
      setCode("")
      setValue("")
      setType("PERCENTAGE")
      fetchCodes()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to create discount code")
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (row: DiscountCodeRow) => {
    setTogglingId(row.id)
    try {
      const res = await fetch(`/api/admin/discount-codes/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: !row.enabled }),
      })
      if (res.ok) {
        setCodes((prev) =>
          prev.map((c) => (c.id === row.id ? { ...c, enabled: !c.enabled } : c))
        )
      }
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/discount-codes/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (res.ok) {
        setCodes((prev) => prev.filter((c) => c.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  const formatValue = (row: DiscountCodeRow) => {
    const num = Number(row.value)
    return row.type === "PERCENTAGE" ? `${num}% off` : `PKR ${num.toLocaleString()} off`
  }

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <div className="bg-[#121213] p-6 rounded-lg border border-[#1A1A1B]">
        <h2 className="text-2xl font-serif font-bold mb-6">Add Discount Code</h2>

        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-md flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="discountCode">Code *</Label>
            <Input
              id="discountCode"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SAVE10"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="discountType">Type *</Label>
            <select
              id="discountType"
              value={type}
              onChange={(e) => setType(e.target.value as DiscountType)}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm mt-1"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed Cash Amount</option>
            </select>
          </div>

          <div>
            <Label htmlFor="discountValue">
              {type === "PERCENTAGE" ? "Percentage (%) *" : "Amount (PKR) *"}
            </Label>
            <Input
              id="discountValue"
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "PERCENTAGE" ? "e.g. 10" : "e.g. 500"}
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <Tag className="w-4 h-4 mr-2" />
                Add Discount Code
              </>
            )}
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="bg-[#121213] p-6 rounded-lg border border-[#1A1A1B]">
        <h2 className="text-2xl font-serif font-bold mb-6">Discount Codes ({codes.length})</h2>

        {listLoading ? (
          <div className="flex items-center gap-2 text-[#BDBDBD]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : codes.length === 0 ? (
          <p className="text-[#BDBDBD]">No discount codes yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {codes.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg border border-[#1A1A1B]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {row.code} — {formatValue(row)}
                    </div>
                    <div className="text-sm text-[#BDBDBD]">
                      {row.enabled ? "Enabled" : "Disabled"}
                      {row.created_at ? ` · ${new Date(row.created_at).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={() => handleToggle(row)}
                      disabled={togglingId === row.id}
                      className="w-5 h-5 accent-[#B8960C]"
                    />
                    <span className="text-sm text-[#BDBDBD]">Enabled</span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(row.id)}
                    disabled={deletingId === row.id}
                  >
                    {deletingId === row.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
