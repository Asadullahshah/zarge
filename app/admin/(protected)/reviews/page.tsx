"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, Trash2, Check, X, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDateInKarachi } from "@/lib/date-utils"

interface Review {
  id: string
  productId: string
  productName: string
  productSlug: string
  userName: string
  userEmail: string
  rating: number
  comment: string | null
  status: string
  createdAt: string
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [statusFilter])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const url = statusFilter
        ? `/api/admin/reviews?status=${statusFilter}`
        : `/api/admin/reviews`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return
    }

    setDeletingId(reviewId)
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setReviews(reviews.filter((r) => r.id !== reviewId))
      } else {
        alert("Failed to delete review")
      }
    } catch (error) {
      console.error("Error deleting review:", error)
      alert("Failed to delete review")
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (reviewId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setReviews(
          reviews.map((r) =>
            r.id === reviewId ? { ...r, status: newStatus } : r
          )
        )
      } else {
        alert("Failed to update review status")
      }
    } catch (error) {
      console.error("Error updating review:", error)
      alert("Failed to update review status")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/20 text-green-400"
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400"
      case "REJECTED":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-serif font-bold mb-8">Reviews</h1>
        <p className="text-[#BDBDBD]">Loading reviews...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8">Reviews</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => setStatusFilter(null)}
          className={`px-4 py-2 rounded ${
            !statusFilter
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("APPROVED")}
          className={`px-4 py-2 rounded ${
            statusFilter === "APPROVED"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`px-4 py-2 rounded ${
            statusFilter === "PENDING"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter("REJECTED")}
          className={`px-4 py-2 rounded ${
            statusFilter === "REJECTED"
              ? "bg-primary text-primary-foreground"
              : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Reviews Table */}
      <div className="bg-[#121213] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-[#1A1A1B]">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#F7F7F7]">
                Product
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#F7F7F7]">
                User
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#F7F7F7]">
                Rating
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#F7F7F7]">
                Comment
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#F7F7F7]">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#F7F7F7]">
                Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#F7F7F7]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1B]">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[#BDBDBD]">
                  No reviews found
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="hover:bg-[#1A1A1B]">
                  <td className="px-6 py-4">
                    <Link
                      href={`/product/${review.productSlug}`}
                      className="text-[#BFA36A] hover:underline"
                    >
                      {review.productName}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-[#F7F7F7]">{review.userName}</p>
                      {review.userEmail && (
                        <p className="text-sm text-[#BDBDBD]">
                          {review.userEmail}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
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
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    {review.comment ? (
                      <p className="text-[#BDBDBD] line-clamp-2">
                        {review.comment}
                      </p>
                    ) : (
                      <span className="text-[#BDBDBD] italic">No comment</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        review.status
                      )}`}
                    >
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#BDBDBD] text-sm">
                    {formatDateInKarachi(review.createdAt, "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {review.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(review.id, "APPROVED")}
                            className="p-1 text-green-400 hover:bg-green-500/20 rounded"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleStatusChange(review.id, "REJECTED")}
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {review.status === "APPROVED" && (
                        <button
                          onClick={() => handleStatusChange(review.id, "REJECTED")}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                          title="Reject"
                        >
                          <EyeOff size={16} />
                        </button>
                      )}
                      {review.status === "REJECTED" && (
                        <button
                          onClick={() => handleStatusChange(review.id, "APPROVED")}
                          className="p-1 text-green-400 hover:bg-green-500/20 rounded"
                          title="Approve"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2
                          size={16}
                          className={deletingId === review.id ? "animate-spin" : ""}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}


