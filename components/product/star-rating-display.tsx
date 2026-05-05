"use client"

import { Star } from "lucide-react"

interface StarRatingDisplayProps {
  rating: number
  totalReviews?: number
  size?: "sm" | "md" | "lg"
  showNumbers?: boolean
}

export function StarRatingDisplay({ 
  rating, 
  totalReviews,
  size = "md",
  showNumbers = true
}: StarRatingDisplayProps) {
  const starSize = size === "sm" ? 14 : size === "lg" ? 24 : 18
  const gap = size === "sm" ? 2 : size === "lg" ? 4 : 3
  
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center" style={{ gap: `${gap}px` }}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            size={starSize}
            className="fill-[#BFA36A] text-[#BFA36A]"
          />
        ))}
        {hasHalfStar && (
          <div className="relative" style={{ width: starSize, height: starSize }}>
            <Star
              size={starSize}
              className="text-[#3A3A3B] absolute inset-0"
            />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star
                size={starSize}
                className="fill-[#BFA36A] text-[#BFA36A]"
              />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={starSize}
            className="text-[#3A3A3B]"
          />
        ))}
      </div>
      {showNumbers && (
        <div className="flex items-center gap-2">
          <span className="text-[#BFA36A] font-semibold text-sm">
            {rating.toFixed(1)}
          </span>
          {totalReviews !== undefined && totalReviews > 0 && (
            <span className="text-[#BDBDBD] text-sm">
              ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          )}
        </div>
      )}
    </div>
  )
}


