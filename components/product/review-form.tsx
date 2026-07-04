"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { useRouter } from "next/navigation"

interface ReviewFormProps {
  productSlug: string
  onSuccess?: () => void
}

export function ReviewForm({ productSlug, onSuccess }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (rating === 0) {
      setError("Please select a rating")
      return
    }
    
    if (!userName.trim()) {
      setError("Please enter your name")
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          userName: userName.trim(),
          userEmail: userEmail.trim() || undefined,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review")
      }
      
      setSuccess(true)
      setRating(0)
      setComment("")
      setUserName("")
      setUserEmail("")
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
      
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    } catch (err: any) {
      setError(err.message || "Failed to submit review. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="mb-3 block">Your Rating *</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={
                  star <= (hoveredRating || rating)
                    ? "fill-primary text-primary cursor-pointer"
                    : "text-gray-300 cursor-pointer hover:text-primary/50"
                }
              />
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <Label htmlFor="userName">
          Your Name *
        </Label>
        <Input
          id="userName"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="mt-2"
          placeholder="Enter your name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="userEmail">
          Your Email (Optional)
        </Label>
        <Input
          id="userEmail"
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          className="mt-2"
          placeholder="Enter your email"
        />
      </div>
      
      <div>
        <Label htmlFor="comment">
          Your Review (Optional)
        </Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-2 min-h-[120px]"
          placeholder="Share your thoughts about this product..."
        />
      </div>
      
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          Thank you! Your review has been submitted.
        </div>
      )}
      
      <Button
        type="submit"
        disabled={loading || rating === 0 || !userName.trim()}
        className="w-full bg-primary hover:bg-primary/85 text-primary-foreground"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
}
