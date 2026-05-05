"use client"

import { useState } from "react"
import { ImageGallery } from "@/components/product/image-gallery"
import { ProductDetails } from "@/components/product/product-details"
import { StarRatingDisplay } from "@/components/product/star-rating-display"

interface ColorImageProviderProps {
  images: Array<{
    id: string
    url: string
    alt?: string
    isPrimary?: boolean
    color?: string
  }>
  productName: string
  productData: any
  averageRating?: number
  totalReviews?: number
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

export function ColorImageProvider({ 
  images, 
  productName, 
  productData,
  averageRating = 0,
  totalReviews = 0,
  sizeChartImage = null,
  variants = []
}: ColorImageProviderProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
      {/* Product Images */}
      <div>
        <ImageGallery
          images={images}
          productName={productName}
          selectedColor={selectedColor}
        />
      </div>

      {/* Product Info */}
      <div>
        <h1 className="text-4xl font-serif font-bold mb-3">{productName}</h1>
        
        {/* Star Rating Display */}
        {averageRating > 0 && (
          <div className="mb-6">
            <StarRatingDisplay 
              rating={averageRating} 
              totalReviews={totalReviews}
              size="md"
            />
          </div>
        )}
        
        <ProductDetails 
          product={productData} 
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          sizeChartImage={sizeChartImage}
          variants={variants}
        />
      </div>
    </div>
  )
}

