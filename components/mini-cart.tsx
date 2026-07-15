"use client"

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { useCart, notifyCartUpdated } from "@/context/cart-context"
import { Button } from "@/components/ui/button"

interface CartItemImage {
  url: string
  alt?: string
  isPrimary?: boolean
}

interface CartItem {
  id: string
  productId: string
  variantId?: string
  productName: string
  productSlug: string
  quantity: number
  price: number
  total: number
  images: CartItemImage[]
  size?: string
  color?: string
}

interface CartResponse {
  items: CartItem[]
  total: number
}

export function MiniCart() {
  const { isOpen, closeCart } = useCart()
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchCart = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/cart", { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to fetch cart")
      }
      const data: CartResponse = await response.json()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (error) {
      console.error("Error fetching cart:", error)
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchCart()
    }
  }, [isOpen, fetchCart])

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ itemId, quantity: newQuantity }),
      })

      if (response.ok) {
        await fetchCart()
        notifyCartUpdated()
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        await fetchCart()
        notifyCartUpdated()
      }
    } catch (error) {
      console.error("Error removing item:", error)
    }
  }

  if (!mounted) {
    return null
  }

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[80] bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
        aria-hidden={!isOpen}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[81] flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-serif font-bold text-black">Your Cart</h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded p-1 text-gray-500 transition-colors hover:text-black"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-gray-500">Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <ShoppingBag className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-lg font-semibold text-black">Your cart is empty</p>
              <p className="mb-6 text-sm text-gray-500">
                Looks like you haven&apos;t added anything yet.
              </p>
              <Button variant="outline" onClick={closeCart}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <ul data-lenis-prevent className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 border-b border-gray-100 pb-4 last:border-b-0"
                >
                  <Link
                    href={`/product/${item.productSlug}`}
                    onClick={closeCart}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100"
                  >
                    {item.images.length > 0 ? (
                      <Image
                        src={item.images[0].url}
                        alt={item.images[0].alt ?? item.productName}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        No Image
                      </div>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/product/${item.productSlug}`}
                      onClick={closeCart}
                      className="truncate font-semibold text-black hover:text-primary"
                    >
                      {item.productName}
                    </Link>

                    {(item.size || item.color) && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {[item.size, item.color].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    <p className="mt-1 text-sm font-semibold text-primary">
                      PKR {item.price.toFixed(2)}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded border border-gray-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 text-black transition-colors hover:bg-gray-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2rem] px-2 text-center text-sm text-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 text-black transition-colors hover:bg-gray-100"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-black">
                          PKR {(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive transition-colors hover:text-destructive/80"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!loading && items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="mb-4 flex items-center justify-between text-lg font-bold text-black">
              <span>Total</span>
              <span>PKR {total.toFixed(2)}</span>
            </div>

            <Link href="/checkout" onClick={closeCart} className="block">
              <Button className="w-full" size="lg">
                Proceed to Checkout
              </Button>
            </Link>

            <Link href="/cart" onClick={closeCart} className="block mt-3 w-full text-center text-sm text-gray-500 transition-colors hover:text-black">
              View Cart
            </Link>
          </div>
        )}
      </aside>
    </>,
    document.body
  )
}
