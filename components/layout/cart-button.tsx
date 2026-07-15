"use client"

import { useEffect, useState } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"

export function CartButton() {
  const { toggleCart } = useCart()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true
    const fetchCartCount = async () => {
      try {
        const response = await fetch("/api/cart")
        const data = await response.json()
        if (active) setCount(data.items?.length || 0)
      } catch (error) {
        console.error("Error fetching cart count:", error)
      }
    }

    // Fetch once, then only refresh on cart changes or when the tab regains focus —
    // no more polling the DB every 5s.
    fetchCartCount()
    window.addEventListener("cart:updated", fetchCartCount)
    window.addEventListener("focus", fetchCartCount)
    return () => {
      active = false
      window.removeEventListener("cart:updated", fetchCartCount)
      window.removeEventListener("focus", fetchCartCount)
    }
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={toggleCart}
      aria-label="Open cart"
    >
      <ShoppingCart className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Button>
  )
}
