"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import { safeFetch, formatErrorMessage } from "@/lib/error-handler"

interface CartItem {
  id: string
  productId: string
  variantId?: string
  productName: string
  productSlug: string
  quantity: number
  price: number
  total: number
  images: Array<{ url: string; alt?: string }>
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCart = useCallback(async () => {
    try {
      const response = await safeFetch("/api/cart")
      const data = await response.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Error fetching cart:", error)
      // Show error but don't block the UI - cart might be empty
      if (items.length === 0) {
        console.error("Failed to load cart:", formatErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }, [items.length])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      })

      if (response.ok) {
        fetchCart()
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchCart()
      }
    } catch (error) {
      console.error("Error removing item:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-3xl font-serif font-bold mb-4 text-black">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-8 text-black">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg p-6 border border-gray-200 flex gap-4 shadow-sm"
            >
              <Link href={`/product/${item.productSlug}`} className="flex-shrink-0">
                <div className="w-24 h-24 relative rounded overflow-hidden bg-gray-100">
                  {item.images && item.images.length > 0 ? (
                    <Image
                      src={item.images[0].url}
                      alt={item.images[0].alt || item.productName}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1">
                <Link href={`/product/${item.productSlug}`}>
                  <h3 className="font-semibold mb-2 text-black hover:text-primary transition-colors">
                    {item.productName}
                  </h3>
                </Link>
                <p className="text-primary font-semibold mb-4">
                  {formatPrice(item.price)}
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-gray-200 rounded">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 text-black hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 min-w-[3rem] text-center text-black">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-black hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg text-black">{formatPrice(item.total)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-24 shadow-sm">
            <h2 className="text-2xl font-serif font-bold mb-6 text-black">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between text-xl font-bold text-black">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Link href="/checkout" className="block">
              <Button className="w-full" size="lg">
                Proceed to Checkout
              </Button>
            </Link>

            <Link href="/" className="block mt-4 text-center text-gray-500 hover:text-black transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

