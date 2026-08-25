"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface ImageGalleryProps {
  images: Array<{
    id: string
    url: string
    alt?: string
    isPrimary?: boolean
    color?: string
  }>
  productName: string
  selectedColor?: string | null
}

export function ImageGallery({ images, productName, selectedColor }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [direction,setDirection] = useState(1)

  // Find the index of the first image matching the selected color
  const findColorImageIndex = useCallback((color: string | null) => {
    if (!color || !images || images.length === 0) return null
    
    const colorLower = color.trim().toLowerCase()
    const index = images.findIndex(img => {
      const imgColor = img.color?.trim().toLowerCase() || ''
      return imgColor === colorLower
    })
    
    return index >= 0 ? index : null
  }, [images])

  // Always show all images in thumbnails, but main image changes based on color selection
  const currentImage = images[selectedIndex] || images[0]

  const nextImage = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % images.length)
    setDirection(1)
  }, [images.length])

  const prevImage = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
    setDirection(-1)
  }, [images.length])

  // When color changes, find and select the matching image
  useEffect(() => {
    if (selectedColor) {
      const colorImageIndex = findColorImageIndex(selectedColor)
      if (colorImageIndex !== null) {
        setSelectedIndex(colorImageIndex)
      }
    } else {
      // If no color selected, show primary image or first image
      const primaryIndex = images.findIndex(img => img.isPrimary)
      setSelectedIndex(primaryIndex >= 0 ? primaryIndex : 0)
    }
  }, [selectedColor, images, findColorImageIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (images.length <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevImage()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextImage()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [images.length, prevImage, nextImage])

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square relative rounded-lg overflow-hidden bg-[#f0f0ed] border border-gray-200 flex items-center justify-center">
        <span className="text-gray-500">No Image Available</span>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      {/* Vertical Thumbnail Gallery - Left Side */}
      {images.length > 1 && (
        <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-2 product-thumbnails-scroll">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative w-20 h-20 rounded overflow-hidden border-2 transition-all flex-shrink-0 ${
                selectedIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-gray-200 hover:border-primary/60"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} - Image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image - Right Side */}
    <div className="relative aspect-square flex-1 rounded-lg overflow-hidden bg-[#f0f0ed] border border-gray-200 group">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
          key={selectedIndex}
          custom={direction}
          initial={{ x: direction * 30 + "%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -direction * 30 + "%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={currentImage.url}
            alt={currentImage.alt || productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={selectedIndex === 0}
          />
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black shadow-sm transition-opacity z-10 opacity-0 group-hover:opacity-100"
            onClick={prevImage}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black shadow-sm transition-opacity z-10 opacity-0 group-hover:opacity-100"
            onClick={nextImage}
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}
    </div>
    </div>
  )
}

