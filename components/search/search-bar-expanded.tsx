"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { safeFetch, formatErrorMessage } from "@/lib/error-handler"
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

export function SearchBarExpanded() {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsExpanded(false)
      setQuery("")
      setResults([])
    }
  }

  const handleResultClick = (slug: string) => {
    router.push(`/product/${slug}`)
    setIsExpanded(false)
    setQuery("")
    setResults([])
  }

  const handleViewAll = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsExpanded(false)
      setQuery("")
      setResults([])
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Don't close if clicking on the search input area
        if ((event.target as HTMLElement).closest('.search-container')) {
          return
        }
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
    <div ref={containerRef} className="search-container">
      {/* Search Input Bar */}
      <div className="py-3">
        <div className="relative max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#BDBDBD] pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsExpanded(true)
              }}
              onKeyDown={(e) => {
                handleKeyDown(e)
                // Handle Enter key to search
                if (e.key === "Enter" && query.trim()) {
                  handleViewAll()
                }
              }}
              onFocus={() => setIsExpanded(true)}
              className="pl-10 pr-10 md:pr-10 bg-[#0B0B0C] border-[#1A1A1B] focus:border-primary h-11 text-base"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  setResults([])
                  inputRef.current?.focus()
                }}
                className="absolute right-12 md:right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD] hover:text-[#F7F7F7] transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Search Button - visible on mobile */}
          <Button
            type="button"
            onClick={() => {
              if (query.trim()) {
                handleViewAll()
              } else {
                inputRef.current?.focus()
              }
            }}
            className="md:hidden flex-shrink-0 h-11 px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Button>
          {/* Close Button - only on desktop when expanded */}
          {((isExpanded || query.trim() || results.length > 0) && !query) && (
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false)
                setQuery("")
                setResults([])
              }}
              className="hidden md:flex flex-shrink-0 w-10 h-11 items-center justify-center text-[#BDBDBD] hover:text-[#F7F7F7] hover:bg-[#1A1A1B] rounded transition-colors border border-[#1A1A1B] hover:border-[#2A2A2B]"
              aria-label="Close search"
              title="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isExpanded && query.trim() && (loading || results.length > 0 || (!loading && results.length === 0 && !error) || error) && (
        <div className="absolute left-0 right-0 top-full bg-[#121213] border-t border-[#1A1A1B] shadow-2xl z-50 max-h-[500px] flex flex-col">
          <div className="container mx-auto px-4 py-4 flex-1 overflow-hidden flex flex-col min-h-0">
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm rounded mb-4 flex-shrink-0">
                {error}
              </div>
            )}

            {loading && (
              <div className="p-8 text-center text-[#BDBDBD] flex-1 flex items-center justify-center">
                <div>
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Searching...</p>
                </div>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="flex flex-col h-full min-h-0">
                <div className="mb-3 text-xs font-medium text-[#BDBDBD] uppercase tracking-wide flex-shrink-0">
                  Found {results.length} result{results.length !== 1 ? "s" : ""}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 pr-2 min-h-0">
                  {results.map((product) => {
                    const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleResultClick(product.slug)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A1A1B] transition-colors text-left group"
                      >
                        {primaryImage && (
                          <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-[#0B0B0C] border border-[#1A1A1B] group-hover:border-primary/50 transition-colors">
                            <Image
                              src={primaryImage.url}
                              alt={primaryImage.alt || product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-[#F7F7F7] group-hover:text-primary transition-colors truncate">
                            {product.name}
                          </h4>
                          {product.short_desc && (
                            <p className="text-xs text-[#BDBDBD] truncate mt-1">
                              {product.short_desc}
                            </p>
                          )}
                          <p className="text-sm text-primary font-semibold mt-2">
                            {formatPrice(product.sale_price || product.price)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="sticky bottom-0 mt-4 pt-3 border-t border-[#1A1A1B] bg-[#121213] flex-shrink-0 pb-2 z-10">
                  <Button
                    variant="outline"
                    className="w-full border-primary/50 text-primary hover:bg-primary/10"
                    onClick={handleViewAll}
                  >
                    View All Results
                  </Button>
                </div>
              </div>
            )}

            {!loading && results.length === 0 && query.trim() && !error && (
              <div className="p-8 text-center text-[#BDBDBD] flex-1 flex items-center justify-center">
                <p>No results found for &quot;{query}&quot;</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

