"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CartButton() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const response = await fetch("/api/cart")
        const data = await response.json()
        setCount(data.items?.length || 0)
      } catch (error) {
        console.error("Error fetching cart count:", error)
      }
    }

    fetchCartCount()
    // Refresh cart count every 5 seconds
    const interval = setInterval(fetchCartCount, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link href="/cart">
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>
    </Link>
  )
}

