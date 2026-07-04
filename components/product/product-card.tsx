"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    salePrice?: number
    images?: Array<{ url: string; isPrimary?: boolean; color?: string; alt?: string }>
    shortDesc?: string
    available_colors?: string[]
    available_sizes?: string[]
    stock?: number
  }
}

// Color name to hex mapping
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    'white': '#FFFFFF',
    'black': '#000000',
    'navy blue': '#001f3f',
    'navy': '#001f3f',
    'beige': '#F5F5DC',
    'cream': '#FFFDD0',
    'brown': '#8B4513',
    'grey': '#808080',
    'gray': '#808080',
    'maroon': '#800000',
    'burgundy': '#800020',
    'olive': '#808000',
    'khaki': '#C3B091',
    'pastel pink': '#FFD1DC',
    'pastel blue': '#AEC6CF',
    'pastel green': '#B5EAD7',
    'pastel yellow': '#FFF9C4',
    'peach': '#FFCBA4',
    'sky blue': '#87CEEB',
    'turquoise': '#40E0D0',
    'purple': '#800080',
    'red': '#FF0000',
    'green': '#008000',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'pink': '#FFC0CB',
    'multi color': '#FFD700',
    'printed': '#FFD700',
  }
  
  const normalized = colorName.trim().toLowerCase()
  return colorMap[normalized] || '#808080' // Default to grey if not found
}

export function ProductCard({ product }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const images = product.images || []
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1
    if (b.isPrimary) return 1
    return 0
  })
  
  const currentImage = sortedImages[currentImageIndex] || sortedImages[0]
  const displayPrice = product.salePrice || product.price
  const hasSale = !!product.salePrice
  const hasMultipleImages = sortedImages.length > 1
  // Check if product is out of stock (stock field should already be calculated from variants if they exist)
  const isOutOfStock = (product.stock ?? 0) <= 0

  // Extract colors from images and combine with available_colors
  const imageColors = images
    .map((img) => img.color)
    .filter((color): color is string => !!color && color.trim() !== '')
  
  const uniqueImageColors = Array.from(new Set(imageColors.map((c) => c.trim().toLowerCase())))
    .map((lowerColor) => {
      const original = imageColors.find((c) => c.trim().toLowerCase() === lowerColor)
      return original?.trim() || lowerColor
    })

  const productAvailableColors = product.available_colors || []
  const allAvailableColors = Array.from(new Set([
    ...productAvailableColors,
    ...uniqueImageColors
  ]))

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)
  }

  return (
    <Link href={`/product/${product.slug}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition-colors h-full flex flex-col min-h-[450px]">
        <div className="aspect-[4/3] relative overflow-hidden bg-[#f0f0ed] group/image flex-shrink-0">
          {currentImage ? (
            <Image
              src={currentImage.url}
              alt={currentImage.alt || product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
          
          {/* Image Navigation Buttons */}
          {hasMultipleImages && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black shadow-sm transition-opacity z-10 opacity-0 group-hover/image:opacity-100"
                onClick={prevImage}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black shadow-sm transition-opacity z-10 opacity-0 group-hover/image:opacity-100"
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                <span className="text-sm bg-white/90 text-black px-3 py-1.5 rounded-full shadow-sm">
                  {currentImageIndex + 1} / {sortedImages.length}
                </span>
              </div>
            </>
          )}
          
          {hasSale && (
            <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm font-semibold z-10">
              Sale
            </div>
          )}
        </div>
        
        {/* Out of Stock Horizontal Bar */}
        {isOutOfStock && (
          <div className="w-full bg-red-500/20 border-t-2 border-red-500 px-4 py-2">
            <p className="text-sm font-semibold text-red-600 text-center">Out of Stock</p>
          </div>
        )}
        <div className="p-4 flex-1 flex flex-col min-h-[180px]">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
            {product.name}
          </h3>
          {product.shortDesc && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[2.5rem]">
              {product.shortDesc}
            </p>
          )}
          
          {/* Available Colors */}
          {allAvailableColors.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1.5 items-center">
                {allAvailableColors.slice(0, 5).map((color) => {
                  const colorHex = getColorHex(color)
                  return (
                    <div
                      key={color}
                      className="flex items-center gap-1"
                      title={color}
                    >
                      <span
                        className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: colorHex }}
                        aria-label={`${color} color`}
                      />
                      <span className="text-sm text-gray-500 capitalize hidden sm:inline">
                        {color}
                      </span>
                    </div>
                  )
                })}
                {allAvailableColors.length > 5 && (
                  <span className="text-sm text-gray-500 ml-1">
                    +{allAvailableColors.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Available Sizes - Only show if product has stock */}
          {!isOutOfStock && product.available_sizes && product.available_sizes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1.5">Available Sizes:</p>
              <div className="flex flex-wrap gap-1.5">
                {product.available_sizes.slice(0, 6).map((size) => (
                  <span
                    key={size}
                    className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-600"
                  >
                    {size}
                  </span>
                ))}
                {product.available_sizes.length > 6 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{product.available_sizes.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-auto">
            {hasSale && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
            <span className="text-lg font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

