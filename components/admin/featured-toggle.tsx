"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FeaturedToggleProps {
  productId: string
  featured: boolean
}

export function FeaturedToggle({ productId, featured: initialFeatured }: FeaturedToggleProps) {
  const router = useRouter()
  const [featured, setFeatured] = useState(initialFeatured)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ featured: !featured }),
      })

      if (!response.ok) {
        throw new Error("Failed to update featured status")
      }

      setFeatured(!featured)
      router.refresh()
    } catch (error) {
      console.error("Error updating featured status:", error)
      alert("Failed to update featured status. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={featured ? "text-yellow-400 hover:text-yellow-300" : "text-[#BDBDBD] hover:text-[#F7F7F7]"}
      title={featured ? "Remove from featured" : "Add to featured"}
    >
      <Star className={`w-4 h-4 ${featured ? "fill-current" : ""}`} />
    </Button>
  )
}

