"use client"

import { Star } from "lucide-react"
import { StarRatingDisplay } from "./star-rating-display"
import { formatDateInKarachi } from "@/lib/date-utils"

interface Review {
  id: string
  userName: string
  userImage?: string
  rating: number
  comment: string
  createdAt: string
}

interface ReviewsListProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function ReviewsList({ reviews, averageRating, totalReviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#BDBDBD]">No reviews yet. Be the first to review this product!</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Reviews Summary */}
      <div className="flex items-start justify-between gap-8 pb-6 border-b border-[#1A1A1B]">
        <div>
          <h3 className="text-2xl font-serif font-bold mb-2 text-[#F7F7F7]">
            Customer Reviews
          </h3>
          <StarRatingDisplay 
            rating={averageRating} 
            totalReviews={totalReviews}
            size="lg"
          />
        </div>
      </div>
      
      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-[#121213] border border-[#1A1A1B] rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {review.userImage ? (
                  <img
                    src={review.userImage}
                    alt={review.userName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1B] flex items-center justify-center">
                    <span className="text-[#BFA36A] font-semibold">
                      {review.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[#F7F7F7]">{review.userName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= review.rating
                              ? "fill-[#BFA36A] text-[#BFA36A]"
                              : "text-[#3A3A3B]"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-sm text-[#BDBDBD]">
                {formatDateInKarachi(review.createdAt, "MMM d, yyyy")}
              </span>
            </div>
            {review.comment && (
              <p className="text-[#BDBDBD] leading-relaxed whitespace-pre-wrap">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

