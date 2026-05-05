"use client"

import { useState, useEffect } from "react"
import { ReviewsList } from "@/components/product/reviews-list"
import { ReviewForm } from "@/components/product/review-form"

interface Review {
  id: string
  userName: string
  userImage?: string
  rating: number
  comment: string
  createdAt: string
}

interface ReviewsSectionProps {
  productSlug: string
}

export function ReviewsSection({ productSlug }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/products/${productSlug}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        setAverageRating(data.stats.averageRating)
        setTotalReviews(data.stats.totalReviews)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productSlug])

  const handleReviewSubmitted = () => {
    fetchReviews()
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-[#BDBDBD]">Loading reviews...</p>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold text-[#F7F7F7]">Reviews</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-[#BFA36A] hover:bg-[#A8925F] text-black rounded transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-[#121213] border border-[#1A1A1B] rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-serif font-bold text-[#F7F7F7]">Write a Review</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-[#BDBDBD] hover:text-[#F7F7F7]"
            >
              Cancel
            </button>
          </div>
          <ReviewForm productSlug={productSlug} onSuccess={handleReviewSubmitted} />
        </div>
      )}

      <ReviewsList
        reviews={reviews}
        averageRating={averageRating}
        totalReviews={totalReviews}
      />
    </div>
  )
}


