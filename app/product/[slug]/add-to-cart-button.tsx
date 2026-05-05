"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface AddToCartButtonProps {
  productId: string
  variantId?: string
  disabled?: boolean
}

export function AddToCartButton({
  productId,
  variantId,
  disabled,
}: AddToCartButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAddToCart = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId,
          quantity: 1,
        }),
      })

      if (response.ok) {
        router.refresh()
        // You could show a toast notification here
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="lg"
      className="flex-1"
      onClick={handleAddToCart}
      disabled={loading || disabled}
    >
      {loading ? "Adding..." : "Add to Cart"}
    </Button>
  )
}

