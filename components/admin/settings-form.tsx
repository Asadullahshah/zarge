"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SettingsFormProps {
  initialSettings: Record<string, string>
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      siteName: initialSettings.siteName || "House of Noire",
      siteDescription: initialSettings.siteDescription || "Premium Luxury Fashion & Home Essentials",
      contactEmail: initialSettings.contactEmail || "",
      contactPhone: initialSettings.contactPhone || "",
      address: initialSettings.address || "",
      socialFacebook: initialSettings.socialFacebook || "",
      socialInstagram: initialSettings.socialInstagram || "",
      socialTwitter: initialSettings.socialTwitter || "",
      shippingRate: initialSettings.shippingRate || "10",
      taxRate: initialSettings.taxRate || "10",
    },
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    setSaved(false)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      {saved && (
        <div className="bg-green-500/10 text-green-400 p-4 rounded-md">
          Settings saved successfully!
        </div>
      )}

      {/* General Settings */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">General Settings</h2>
        
        <div>
          <Label htmlFor="siteName">Site Name</Label>
          <Input id="siteName" {...register("siteName")} />
        </div>

        <div>
          <Label htmlFor="siteDescription">Site Description</Label>
          <Input id="siteDescription" {...register("siteDescription")} />
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        
        <div>
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input id="contactEmail" type="email" {...register("contactEmail")} />
        </div>

        <div>
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input id="contactPhone" type="tel" {...register("contactPhone")} />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <textarea
            id="address"
            {...register("address")}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </div>
      </section>

      {/* Social Media */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Social Media</h2>
        
        <div>
          <Label htmlFor="socialFacebook">Facebook URL</Label>
          <Input id="socialFacebook" type="url" {...register("socialFacebook")} />
        </div>

        <div>
          <Label htmlFor="socialInstagram">Instagram URL</Label>
          <Input id="socialInstagram" type="url" {...register("socialInstagram")} />
        </div>

        <div>
          <Label htmlFor="socialTwitter">Twitter URL</Label>
          <Input id="socialTwitter" type="url" {...register("socialTwitter")} />
        </div>
      </section>

      {/* E-commerce Settings */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">E-commerce Settings</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="shippingRate">Shipping Rate ($)</Label>
            <Input id="shippingRate" type="number" step="0.01" {...register("shippingRate")} />
          </div>

          <div>
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input id="taxRate" type="number" step="0.01" {...register("taxRate")} />
          </div>
        </div>
      </section>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  )
}

