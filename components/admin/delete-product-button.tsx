"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteProductButtonProps {
  productId: string
  productName: string
  categorySlug: string
}

export function DeleteProductButton({ productId, productName, categorySlug }: DeleteProductButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      router.refresh()
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Failed to delete product. Please try again.")
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
    >
      <Trash2 className="w-4 h-4 mr-1" />
      {loading ? "Deleting..." : "Delete"}
    </Button>
  )
}

