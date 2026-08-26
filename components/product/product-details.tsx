"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Package, Ruler, Palette, Info, MapPin, Scissors, Plus, Minus, Heart, X } from "lucide-react"
import { safeFetch, formatErrorMessage } from "@/lib/error-handler"
import { useCart, notifyCartUpdated } from "@/context/cart-context"
import { createPortal } from "react-dom"
import Image from "next/image";
import { getColorHex } from "@/lib/color-utils"

interface ProductDetailsProps {
  product: {
    id: string
    slug: string
    name: string
    short_desc?: string
    description?: string
    price: number
    sale_price?: number
    stock: number
    sku?: string
    piece_count?: string
    fabric_type?: string
    fabric_material?: string
    care_instructions?: string
    available_sizes?: string[]
    available_colors?: string[]
    color_swatches?: Record<string, string>
    measurements?: Record<string, string>
    country_of_origin?: string
    weight?: number
    tags?: string[]
  }
  selectedColor?: string | null
  onColorChange?: (color: string | null) => void
  sizeChartImage?: string | null
  variants?: Array<{
    id: string
    options: {
      size?: string
      color?: string
      [key: string]: any
    }
    stock: number
  }>
}

export function ProductDetails({ product, selectedColor: externalSelectedColor, onColorChange, sizeChartImage, variants = [] }: ProductDetailsProps) {
  const router = useRouter()
  const { openCart } = useCart()
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [internalSelectedColor, setInternalSelectedColor] = useState<string | null>(null)
  
  // Use external color if provided, otherwise use internal state
  const selectedColor = externalSelectedColor !== undefined ? externalSelectedColor : internalSelectedColor
  const setSelectedColor = (color: string | null) => {
    if (onColorChange) {
      onColorChange(color)
    } else {
      setInternalSelectedColor(color)
    }
  }
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)
  const [currentStock, setCurrentStock] = useState(product.stock)
  const [error, setError] = useState<string | null>(null)
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])


  // Helper function to normalize color names for comparison (memoized)
  const normalizeColor = useCallback((color: string) => color.trim().toLowerCase(), [])

  // Helper function to check if a size-color combination is available (has stock > 0)
  const isVariantAvailable = useCallback((size?: string, color?: string): boolean => {
    if (variants.length === 0) {
      // If no variants, fall back to product stock
      return product.stock > 0
    }

    // Find variant matching size and color
    const matchingVariant = variants.find((variant) => {
      // Parse options if it's a string
      let options = variant.options
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options)
        } catch {
          options = {}
        }
      }
      
      const variantSize = options?.size
      const variantColor = options?.color
      
      const sizeMatch = !size || !variantSize || normalizeColor(String(variantSize)) === normalizeColor(String(size))
      const colorMatch = !color || !variantColor || normalizeColor(String(variantColor)) === normalizeColor(String(color))
      
      return sizeMatch && colorMatch
    })

    return matchingVariant ? (matchingVariant.stock > 0) : false
  }, [variants, product.stock, normalizeColor])

  // Check if a size is available for the selected color
  const isSizeAvailable = (size: string): boolean => {
    if (!selectedColor) {
      // If no color selected, check if size is available in any variant
      if (variants.length === 0) {
        return product.stock > 0
      }
      return variants.some((v) => {
        // Parse options if it's a string
        let options = v.options
        if (typeof options === 'string') {
          try {
            options = JSON.parse(options)
          } catch {
            options = {}
          }
        }
        const variantSize = options?.size
        return variantSize && normalizeColor(String(variantSize)) === normalizeColor(size) && v.stock > 0
      })
    }
    return isVariantAvailable(size, selectedColor)
  }

  // Check if a color is available for the selected size
  const isColorAvailable = (color: string): boolean => {
    if (!selectedSize) {
      // If no size selected, check if color is available in any variant
      if (variants.length === 0) {
        return product.stock > 0
      }
      return variants.some((v) => {
        // Parse options if it's a string
        let options = v.options
        if (typeof options === 'string') {
          try {
            options = JSON.parse(options)
          } catch {
            options = {}
          }
        }
        const variantColor = options?.color
        return variantColor && normalizeColor(String(variantColor)) === normalizeColor(color) && v.stock > 0
      })
    }
    return isVariantAvailable(selectedSize, color)
  }

  // Clear selected size if it's not available for the selected color
  useEffect(() => {
    if (selectedSize && selectedColor) {
      const available = isVariantAvailable(selectedSize, selectedColor)
      if (!available) {
        setSelectedSize(null)
      }
    }
  }, [selectedColor, selectedSize, isVariantAvailable])

  // Clear selected color if it's not available for the selected size
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const available = isVariantAvailable(selectedSize, selectedColor)
      if (!available) {
        setSelectedColor(null)
      }
    }
  }, [selectedSize, selectedColor, isVariantAvailable])

  // Fetch variant stock when size or color changes
  useEffect(() => {
    const fetchVariantStock = async () => {
      // Only fetch if we have size or color selected
      if (!selectedSize && !selectedColor) {
        setCurrentStock(product.stock)
        return
      }

      try {
        const params = new URLSearchParams()
        if (selectedSize) params.append("size", selectedSize)
        if (selectedColor) params.append("color", selectedColor)

        const response = await fetch(`/api/products/${product.slug}/variant-stock?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setCurrentStock(data.stock || 0)
        }
      } catch (err) {
        console.error("Error fetching variant stock:", err)
        // Fallback to product stock on error
        setCurrentStock(product.stock)
      }
    }

    fetchVariantStock()
  }, [selectedSize, selectedColor, product.slug, product.stock])

  const handleAddToCart = async () => {
    if (currentStock === 0 || loading || added) {
      return
    }

    // Check if both size and color options are available
    const hasSizes = product.available_sizes && product.available_sizes.length > 0
    const hasColors = product.available_colors && product.available_colors.length > 0

    // If color is selected but size is not, show message to select size
    if (selectedColor && hasSizes && !selectedSize) {
      setError("Please select a size as well")
      setTimeout(() => setError(null), 5000)
      return
    }

    // If size is selected but color is not, show message to select color
    if (selectedSize && hasColors && !selectedColor) {
      setError("Please select a color as well")
      setTimeout(() => setError(null), 5000)
      return
    }

    // Require size selection if sizes are available
    if (hasSizes && !selectedSize) {
      setError("Please select a size before adding to cart")
      setTimeout(() => setError(null), 5000)
      return
    }

    // Require color selection if multiple colors are available
    if (hasColors && !selectedColor) {
      setError("Please select a color before adding to cart")
      setTimeout(() => setError(null), 5000)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await safeFetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important for cookies
                body: JSON.stringify({
                  productId: product.id,
                  quantity: quantity,
                  variantId: null, // TODO: Handle variant selection based on size/color
                  size: selectedSize || null,
                  color: selectedColor || null,
                }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Update stock in state
        setCurrentStock(prev => Math.max(0, prev - 1))

        // Show success feedback
        setAdded(true)
        notifyCartUpdated()
        openCart()
        setLoading(false)
        
        // Reset after 2 seconds
        setTimeout(() => {
          setAdded(false)
          // Refresh to get updated stock from server
          router.refresh()
        }, 2000)
      } else {
        throw new Error(data.error || "Failed to add to cart")
      }
    } catch (error: unknown) {
      console.error("Error adding to cart:", error)
      const errorMessage = formatErrorMessage(error)
      setError(errorMessage)
      setLoading(false)
      setAdded(false)
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000)
    }
  }

  // Fall back to the default size chart image so the button always has something to show
  const displaySizeChartImage = sizeChartImage || "/img/Size.jpeg"

  // If sale_price exists and is greater than 0, show sale price as main price
  const hasSale = product.sale_price != null && product.sale_price > 0
  const displayPrice = hasSale ? (product.sale_price ?? product.price) : product.price
  const originalPrice = hasSale ? product.price : null

  return (
    <div className="space-y-6">
      {/* Price */}
      <div>
        {hasSale && (
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl text-gray-400 line-through">
              {formatPrice(originalPrice!)}
            </span>
            <span className="px-2 py-1 bg-primary/15 text-primary text-sm font-semibold rounded">
              SALE
            </span>
          </div>
        )}
        <div className="text-4xl font-bold text-primary">
          {formatPrice(displayPrice)}
        </div>
        {product.sku && (
          <p className="text-sm text-gray-500 mt-2 font-mono">SKU: {product.sku}</p>
        )}
      </div>

      {/* Stock Status */}
      {(() => {
        const hasSizes = product.available_sizes && product.available_sizes.length > 0
        const hasColors = product.available_colors && product.available_colors.length > 0
        const needsSize = hasSizes && !selectedSize
        const needsColor = hasColors && !selectedColor
        const isExactCombo = !needsSize && !needsColor

        let label: string
        if (isExactCombo) {
          label = currentStock > 0 ? `In Stock (${currentStock} available)` : "Out of Stock"
        } else if (selectedSize || selectedColor) {
          // Partial selection: currentStock is summed across the remaining, unselected attribute
          label = currentStock > 0
            ? `${currentStock} available for ${selectedSize || selectedColor}`
            : "Out of Stock"
        } else {
          label = currentStock > 0 ? `In Stock (${currentStock} available)` : "Out of Stock"
        }

        return (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${currentStock > 0 ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className={`font-semibold ${currentStock > 0 ? "text-green-600" : "text-red-600"}`}>
              {label}
            </span>
          </div>
        )
      })()}

      {/* Size Chart Model */}

      {/*   Black Overley 
            Size Chart White Card    // */}

      {isSizeChartOpen && createPortal (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsSizeChartOpen(false)}
          >
            <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-auto relative"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsSizeChartOpen(false)}
                aria-label="Close size chart"
                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="mb-4 pr-10 text-lg font-semibold">Size Chart</h3>
              <div className="relative w-full aspect-square max-w-[70vh] mx-auto">
              <Image
                src={displaySizeChartImage}
                alt="Size Chart"
                width={1000}
                height={1000}
                className="object-contain"
              />
              </div>
            </div>
        </div>,
        document.body
      )}

      {/* Short Description */}
      {product.short_desc && (
        <p className="text-lg text-gray-600">{product.short_desc}</p>
      )}

      {/* Piece Count (for stitched items) */}
      {product.piece_count && (
        <div className="flex items-center gap-2 text-gray-600">
          <Scissors className="w-5 h-5" />
          <span>
            <strong>Piece Count:</strong> {product.piece_count.replace("_", " ")}
          </span>
        </div>
      )}

      {/* Size Selection */}
      {product.available_sizes && product.available_sizes.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setIsSizeChartOpen(true)}
            className="mb-3 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
          >
            Size Chart
          </button>
          <label className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Select Size <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {product.available_sizes.map((size) => {
              const isAvailable = isSizeAvailable(size)
              const isSelected = selectedSize === size
              
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedSize(size)
                    }
                  }}
                  disabled={!isAvailable}
                  className={`px-4 py-2 rounded border-2 transition-all relative ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : !isAvailable
                      ? "border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                      : "border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-700"
                  }`}
                >
                  {!isAvailable && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="border-t-2 border-red-500 w-full mx-2"></span>
                    </span>
                  )}
                  {size}
                </button>
              )
            })}
          </div>
          {selectedSize && (
            <p className="text-sm text-gray-500 mt-2">
              Selected: <span className="text-primary font-semibold">{selectedSize}</span>
            </p>
          )}
          {selectedSize && product.available_colors && product.available_colors.length > 0 && !selectedColor && (
            <p className="text-sm text-amber-600 mt-2">
              Please select a color as well
            </p>
          )}
        </div>
      )}

      {/* Available Colors Display */}
      {product.available_colors && product.available_colors.length > 0 && (
        <div>
          <label className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Select Color {product.available_colors.length > 0 && <span className="text-red-500">*</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {product.available_colors.map((color) => {
              const colorHex = getColorHex(color, product.color_swatches)
              const isAvailable = isColorAvailable(color)
              const isSelected = selectedColor === color
              
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedColor(color)
                    }
                  }}
                  disabled={!isAvailable}
                  className={`px-4 py-2 rounded border-2 transition-all capitalize flex items-center gap-2 relative ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : !isAvailable
                      ? "border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                      : "border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-700"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 ${!isAvailable ? 'opacity-60' : ''}`}
                    style={{ backgroundColor: colorHex }}
                    aria-label={`${color} color swatch`}
                  />
                  {!isAvailable && (
                    <span className="absolute left-9 top-1/2 -translate-y-1/2 border-t-2 border-red-500 w-[calc(100%-2.5rem)] pointer-events-none"></span>
                  )}
                  {color}
                </button>
              )
            })}
          </div>
          {selectedColor && (
            <p className="text-sm text-gray-500 mt-2">
              Selected: <span className="text-primary font-semibold capitalize">{selectedColor}</span>
            </p>
          )}
          {selectedColor && product.available_sizes && product.available_sizes.length > 0 && !selectedSize && (
            <p className="text-sm text-amber-600 mt-2">
              Please select a size as well
            </p>
          )}
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min="1"
          max={currentStock}
          value={quantity}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1
            setQuantity(Math.max(1, Math.min(value, currentStock)))
          }}
          className="w-16 h-10 text-center border-2 border-gray-200 rounded bg-white text-black focus:border-primary focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
          disabled={quantity >= currentStock}
          className="w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          onClick={handleAddToCart}
          disabled={
            loading || 
            added || 
            (product.available_sizes && product.available_sizes.length > 0 && !selectedSize) ||
            (product.available_colors && product.available_colors.length > 0 && !selectedColor)
          }
          size="lg"
          variant="outline"
          className={`flex-1 border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors ${added ? "bg-green-500 hover:bg-green-600 border-green-500 text-white" : ""}`}
        >
          <Package className="w-5 h-5 mr-2" />
          {added 
            ? "Added to Cart!" 
            : loading 
            ? "Adding..." 
            : "Add to Cart"}
        </Button>
        <Button
          onClick={async () => {
            // First add to cart, then redirect to checkout
            if (loading) {
              return
            }

            // Check if both size and color options are available
            const hasSizes = product.available_sizes && product.available_sizes.length > 0
            const hasColors = product.available_colors && product.available_colors.length > 0

            // If color is selected but size is not, show message to select size
            if (selectedColor && hasSizes && !selectedSize) {
              setError("Please select a size as well")
              setTimeout(() => setError(null), 5000)
              return
            }

            // If size is selected but color is not, show message to select color
            if (selectedSize && hasColors && !selectedColor) {
              setError("Please select a color as well")
              setTimeout(() => setError(null), 5000)
              return
            }

            // Require size selection if sizes are available
            if (hasSizes && !selectedSize) {
              setError("Please select a size before buying")
              setTimeout(() => setError(null), 5000)
              return
            }

            // Require color selection if multiple colors are available
            if (hasColors && !selectedColor) {
              setError("Please select a color before buying")
              setTimeout(() => setError(null), 5000)
              return
            }

            setLoading(true)
            setError(null)
            try {
              const response = await safeFetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  productId: product.id,
                  quantity: quantity,
                  variantId: null,
                  size: selectedSize || null,
                  color: selectedColor || null,
                }),
              })

              const data = await response.json()
              
              if (data.success) {
                // Redirect to checkout
                router.push("/checkout")
              } else {
                setError(data.error || "Failed to add to cart")
                setTimeout(() => setError(null), 5000)
                setLoading(false)
              }
            } catch (err) {
              setError(formatErrorMessage(err))
              setTimeout(() => setError(null), 5000)
              setLoading(false)
            }
          }}
          disabled={
            loading || 
            (product.available_sizes && product.available_sizes.length > 0 && !selectedSize) ||
            (product.available_colors && product.available_colors.length > 0 && !selectedColor)
          }
          size="lg"
          className="flex-1 bg-primary hover:bg-primary/85 text-primary-foreground transition-colors"
        >
          Buy Now
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="hidden border-gray-300 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Heart className="w-5 h-5" />
        </Button>
      </div>

      {/* Detailed Information */}
      <div className="pt-6 border-t border-gray-200 space-y-4">
        {/* Fabric Information */}
        {(product.fabric_type || product.fabric_material) && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Fabric & Material
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              {product.fabric_type && (
                <p><strong>Type:</strong> {product.fabric_type}</p>
              )}
              {product.fabric_material && (
                <p><strong>Material:</strong> {product.fabric_material}</p>
              )}
            </div>
          </div>
        )}

        {/* Care Instructions */}
        {product.care_instructions && (
          <div>
            <h3 className="font-semibold mb-2">Care Instructions</h3>
            <p className="text-sm text-gray-600">{product.care_instructions}</p>
          </div>
        )}

        {/* Measurements */}
        {product.measurements && Object.keys(product.measurements).length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Measurements</h3>
            <div className="space-y-1 text-sm text-gray-600">
              {Object.entries(product.measurements).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {value}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="space-y-1 text-sm text-gray-600">
          {product.country_of_origin && (
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <strong>Country of Origin:</strong> {product.country_of_origin}
            </p>
          )}
          {product.weight && (
            <p>
              <strong>Weight:</strong> {product.weight} kg
            </p>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-50 rounded-full text-sm border border-gray-200 text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

