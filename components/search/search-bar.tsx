"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { safeFetch, formatErrorMessage } from "@/lib/error-handler"
import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"

interface SearchResult {
  id: string
  name: string
  slug: string
  price: number
  sale_price?: number
  short_desc?: string
  images: Array<{ url: string; alt?: string; isPrimary?: boolean }>
}

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const searchProducts = useCallback(async () => {
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
  }, [query])

  // Auto-search as user types (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setError(null)
      return
    }

    const timeoutId = setTimeout(() => {
      searchProducts()
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [query, searchProducts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      await searchProducts()
    }
  }

  const handleViewAll = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsExpanded(false)
      setQuery("")
      setResults([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsExpanded(false)
      setQuery("")
      setResults([])
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleResultClick = (slug: string) => {
    router.push(`/product/${slug}`)
    setIsExpanded(false)
    setQuery("")
    setResults([])
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isExpanded])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  return (
    <div ref={containerRef} className="relative">
      {/* Search Icon Button (when collapsed) */}
      {!isExpanded && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={() => setIsExpanded(true)}
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </Button>
      )}

      {/* Expanded Search Bar */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[500px] md:w-[600px] bg-[#121213] border border-[#1A1A1B] rounded-lg shadow-2xl">
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="p-4 border-b border-[#1A1A1B]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BDBDBD] pointer-events-none" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 bg-[#0B0B0C] border-[#1A1A1B] focus:border-primary h-11 text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("")
                    setResults([])
                    inputRef.current?.focus()
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD] hover:text-[#F7F7F7] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Search Results Dropdown */}
          {(query.trim() && (loading || results.length > 0 || (!loading && results.length === 0 && !error) || error)) && (
            <div className="max-h-[500px] overflow-y-auto">
              {error && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {loading && (
                <div className="p-8 text-center text-[#BDBDBD]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Searching...</p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="p-2">
                  <div className="mb-2 px-2 text-sm text-[#BDBDBD]">
                    Found {results.length} result{results.length !== 1 ? "s" : ""}
                  </div>
                  <div className="space-y-1">
                    {results.map((product) => {
                      const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleResultClick(product.slug)}
                          className="w-full flex items-center gap-3 p-2 rounded hover:bg-[#1A1A1B] transition-colors text-left"
                        >
                          {primaryImage && (
                            <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-[#0B0B0C] border border-[#1A1A1B]">
                              <Image
                                src={primaryImage.url}
                                alt={primaryImage.alt || product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-[#F7F7F7] truncate">
                              {product.name}
                            </h4>
                            {product.short_desc && (
                              <p className="text-xs text-[#BDBDBD] truncate mt-1">
                                {product.short_desc}
                              </p>
                            )}
                            <p className="text-sm text-primary font-semibold mt-1">
                              {formatPrice(product.sale_price || product.price)}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#1A1A1B]">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleViewAll}
                    >
                      View All Results
                    </Button>
                  </div>
                </div>
              )}

              {!loading && results.length === 0 && query.trim() && !error && (
                <div className="p-8 text-center text-[#BDBDBD]">
                  <p>No results found for &quot;{query}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Search Button (only when collapsed) */}
      {!isExpanded && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsExpanded(true)}
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </Button>
      )}

      {/* Mobile Expanded Search (full width in mobile menu) */}
      {isExpanded && (
        <div className="md:hidden w-full bg-[#121213] border border-[#1A1A1B] rounded-lg shadow-lg">
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="p-4 border-b border-[#1A1A1B]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BDBDBD] pointer-events-none" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 bg-[#0B0B0C] border-[#1A1A1B] focus:border-primary h-11 text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("")
                    setResults([])
                    inputRef.current?.focus()
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD] hover:text-[#F7F7F7] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Search Results Dropdown */}
          {(query.trim() && (loading || results.length > 0 || (!loading && results.length === 0 && !error) || error)) && (
            <div className="max-h-[400px] overflow-y-auto">
              {error && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {loading && (
                <div className="p-8 text-center text-[#BDBDBD]">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Searching...</p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="p-2">
                  <div className="mb-2 px-2 text-sm text-[#BDBDBD]">
                    Found {results.length} result{results.length !== 1 ? "s" : ""}
                  </div>
                  <div className="space-y-1">
                    {results.map((product) => {
                      const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleResultClick(product.slug)}
                          className="w-full flex items-center gap-3 p-2 rounded hover:bg-[#1A1A1B] transition-colors text-left"
                        >
                          {primaryImage && (
                            <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-[#0B0B0C] border border-[#1A1A1B]">
                              <Image
                                src={primaryImage.url}
                                alt={primaryImage.alt || product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-[#F7F7F7] truncate">
                              {product.name}
                            </h4>
                            {product.short_desc && (
                              <p className="text-xs text-[#BDBDBD] truncate mt-1">
                                {product.short_desc}
                              </p>
                            )}
                            <p className="text-sm text-primary font-semibold mt-1">
                              {formatPrice(product.sale_price || product.price)}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#1A1A1B]">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleViewAll}
                    >
                      View All Results
                    </Button>
                  </div>
                </div>
              )}

              {!loading && results.length === 0 && query.trim() && !error && (
                <div className="p-8 text-center text-[#BDBDBD]">
                  <p>No results found for &quot;{query}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

