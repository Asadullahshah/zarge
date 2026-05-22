"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { safeFetch, formatErrorMessage } from "@/lib/error-handler"
import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: string
  name: string
  slug: string
  price: number
  sale_price?: number
  short_desc?: string
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
    // Clear results when modal opens
    if (isOpen) {
      setResults([])
      setError(null)
      setQuery("")
    }
  }, [isOpen])

  const searchProducts = async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await safeFetch(
        `/api/products?search=${encodeURIComponent(query.trim())}&limit=8`
      )
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const formattedResults = (data.products || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: parseFloat(product.price),
        sale_price: product.sale_price ? parseFloat(product.sale_price) : undefined,
        short_desc: product.short_desc,
        images: product.images || [],
      }))

      setResults(formattedResults)
    } catch (err: unknown) {
      console.error("Search error:", err)
      setError(formatErrorMessage(err))
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      await searchProducts()
    }
  }

  const handleViewAll = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#121213] border border-[#1A1A1B] rounded-lg shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-[#1A1A1B]">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BDBDBD]" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 bg-[#0B0B0C] border-[#1A1A1B] focus:border-primary"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD] hover:text-[#F7F7F7]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" disabled={!query.trim() || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 text-center text-destructive text-sm">{error}</div>
          )}

          {loading && query && (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-[#BDBDBD]">Searching...</p>
            </div>
          )}

          {!loading && !error && query && results.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-[#BDBDBD]">No products found for &quot;{query}&quot;</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="p-4">
              <p className="text-sm text-[#BDBDBD] mb-4">
                Found {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {results.map((product) => {
                  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]
                  const displayPrice = product.sale_price || product.price
                  const hasSale = !!product.sale_price

                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      onClick={onClose}
                      className="flex gap-4 p-3 rounded-lg hover:bg-[#1A1A1B] transition-colors group"
                    >
                      {primaryImage && (
                        <div className="w-16 h-16 relative rounded overflow-hidden bg-[#0B0B0C] flex-shrink-0">
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.alt || product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        {product.short_desc && (
                          <p className="text-sm text-[#BDBDBD] line-clamp-1 mb-2">
                            {product.short_desc}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          {hasSale && (
                            <span className="text-xs text-[#BDBDBD] line-through">
                              {formatPrice(product.price)}
                            </span>
                          )}
                          <span className="text-primary font-semibold">
                            {formatPrice(displayPrice)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              {results.length >= 8 && (
                <div className="mt-4 pt-4 border-t border-[#1A1A1B]">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleViewAll}
                  >
                    View All Results
                  </Button>
                </div>
              )}
            </div>
          )}

          {!query && (
            <div className="p-8 text-center text-[#BDBDBD]">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start typing to search for products</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

