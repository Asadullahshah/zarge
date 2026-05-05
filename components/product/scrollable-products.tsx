"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "./product-card"

interface ScrollableProductsProps {
  products: any[]
}

export function ScrollableProducts({ products }: ScrollableProductsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollButtons)
      window.addEventListener("resize", checkScrollButtons)
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollButtons)
        window.removeEventListener("resize", checkScrollButtons)
      }
    }
  }, [products])

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400 // Scroll by 400px
      const currentScroll = scrollContainerRef.current.scrollLeft
      const newScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount

      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      })
    }
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    // Don't start dragging if clicking on a link or button
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button')) {
      return
    }
    setIsDragging(true)
    const rect = scrollContainerRef.current.getBoundingClientRect()
    setStartX(e.pageX - rect.left)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
    scrollContainerRef.current.style.cursor = "grabbing"
    scrollContainerRef.current.style.userSelect = "none"
    e.preventDefault()
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab"
      scrollContainerRef.current.style.userSelect = "auto"
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab"
      scrollContainerRef.current.style.userSelect = "auto"
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const rect = scrollContainerRef.current.getBoundingClientRect()
    const x = e.pageX - rect.left
    const walk = (x - startX) * 2 // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
  }

  const firstProductRef = useRef<HTMLDivElement>(null)
  const [lineHeight, setLineHeight] = useState(0)

  useEffect(() => {
    const updateLineHeight = () => {
      if (firstProductRef.current) {
        const height = firstProductRef.current.offsetHeight
        setLineHeight(height)
      }
    }
    
    updateLineHeight()
    window.addEventListener('resize', updateLineHeight)
    return () => window.removeEventListener('resize', updateLineHeight)
  }, [products])

  return (
    <div className="relative flex items-start gap-8">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="flex-shrink-0 w-12 hidden md:flex items-center justify-center transition-all duration-300 group relative"
          style={{ height: lineHeight || 'auto' }}
          aria-label="Scroll left"
        >
          <div 
            className="absolute left-0 w-0.5"
            style={{ 
              height: lineHeight || 'auto',
              top: 0,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(212, 175, 55, 0.6) 20%, rgba(212, 175, 55, 0.4) 50%, rgba(212, 175, 55, 0.6) 80%, transparent 100%)',
            }}
          />
          <ChevronLeft className="w-6 h-6 text-primary/60 group-hover:text-primary transition-colors relative z-10" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div className="flex gap-6 min-w-max items-start">
          {products.map((product: any, index: number) => {
            const productData = {
              ...product,
              images: product.images || [],
              price: parseFloat(product.price),
              salePrice: product.sale_price ? parseFloat(product.sale_price) : undefined,
              stock: product.stock ? parseInt(product.stock) : 0,
            }
            return (
              <div 
                key={product.id} 
                ref={index === 0 ? firstProductRef : null}
                className="flex-shrink-0 w-[280px] sm:w-[320px] pointer-events-auto"
              >
                <ProductCard product={productData} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="flex-shrink-0 w-12 hidden md:flex items-center justify-center transition-all duration-300 group relative"
          style={{ height: lineHeight || 'auto' }}
          aria-label="Scroll right"
        >
          <div 
            className="absolute right-0 w-0.5"
            style={{ 
              height: lineHeight || 'auto',
              top: 0,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(212, 175, 55, 0.6) 20%, rgba(212, 175, 55, 0.4) 50%, rgba(212, 175, 55, 0.6) 80%, transparent 100%)',
            }}
          />
          <ChevronRight className="w-6 h-6 text-primary/60 group-hover:text-primary transition-colors relative z-10" />
        </button>
      )}
    </div>
  )
}

