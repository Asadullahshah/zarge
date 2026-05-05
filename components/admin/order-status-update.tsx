"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface OrderStatusUpdateProps {
  orderId: string
  currentStatus?: string
  currentPaymentStatus?: string
  type: "status" | "payment_status"
  compact?: boolean
}

const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
]

const paymentStatusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
]

export function OrderStatusUpdate({
  orderId,
  currentStatus,
  currentPaymentStatus,
  type,
  compact = false,
}: OrderStatusUpdateProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Use currentPaymentStatus if type is payment_status, otherwise use currentStatus
  const actualCurrentStatus = type === "payment_status" 
    ? (currentPaymentStatus || currentStatus || "PENDING")
    : (currentStatus || "PENDING")
  
  const [selectedStatus, setSelectedStatus] = useState(actualCurrentStatus)
  
  // Sync selectedStatus when currentStatus or currentPaymentStatus changes
  useEffect(() => {
    const newStatus = type === "payment_status" 
      ? (currentPaymentStatus || currentStatus || "PENDING")
      : (currentStatus || "PENDING")
    setSelectedStatus(newStatus)
  }, [currentStatus, currentPaymentStatus, type])
  const [showTrackingDialog, setShowTrackingDialog] = useState(false)
  const [trackingId, setTrackingId] = useState("")

  const options = type === "status" ? statusOptions : paymentStatusOptions

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus)
    
    // If changing to SHIPPED, show dialog to get tracking ID
    if (type === "status" && newStatus === "SHIPPED" && actualCurrentStatus !== "SHIPPED") {
      setShowTrackingDialog(true)
    }
  }

  const handleUpdate = async (providedTrackingId?: string) => {
    if (selectedStatus === actualCurrentStatus) {
      return
    }

    // If marking as SHIPPED, require tracking ID
    if (type === "status" && selectedStatus === "SHIPPED") {
      const finalTrackingId = providedTrackingId || trackingId
      if (!finalTrackingId || finalTrackingId.trim() === "") {
        alert("Tracking ID is required when marking order as SHIPPED")
        return
      }
    }

    setLoading(true)
    try {
      const body: any = {
        [type]: selectedStatus,
      }

      // Include tracking_id if marking as SHIPPED
      if (type === "status" && selectedStatus === "SHIPPED") {
        body.tracking_id = providedTrackingId || trackingId
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Failed to update status")
        setLoading(false)
        return
      }

      setShowTrackingDialog(false)
      setTrackingId("")
      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  const handleTrackingSubmit = () => {
    if (!trackingId || trackingId.trim() === "") {
      alert("Please enter a tracking ID")
      return
    }
    handleUpdate(trackingId)
  }

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => {
              const newStatus = e.target.value
              setSelectedStatus(newStatus)
              
              // If changing to SHIPPED, show dialog (don't auto-update)
              if (type === "status" && newStatus === "SHIPPED" && actualCurrentStatus !== "SHIPPED") {
                setShowTrackingDialog(true)
              }
            }}
            onBlur={() => {
              // Only auto-update if status changed and it's NOT SHIPPED (SHIPPED requires dialog)
              if (selectedStatus !== actualCurrentStatus && !(type === "status" && selectedStatus === "SHIPPED" && actualCurrentStatus !== "SHIPPED")) {
                handleUpdate()
              }
            }}
            disabled={loading}
            className="bg-[#1A1A1B] border border-[#2A2A2B] rounded px-2 py-1 text-sm text-white"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tracking ID Dialog */}
        {showTrackingDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#121213] border border-[#1A1A1B] rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[#F7F7F7]">Enter Tracking ID</h3>
                <button
                  onClick={() => {
                    setShowTrackingDialog(false)
                    setSelectedStatus(actualCurrentStatus)
                    setTrackingId("")
                  }}
                  className="text-[#BDBDBD] hover:text-[#F7F7F7]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[#BDBDBD] mb-4">
                Tracking ID is required to mark this order as shipped.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tracking-id">Tracking ID *</Label>
                  <Input
                    id="tracking-id"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Enter tracking number"
                    className="mt-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && trackingId.trim()) {
                        handleTrackingSubmit()
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleTrackingSubmit}
                    disabled={loading || !trackingId.trim()}
                    className="flex-1"
                  >
                    {loading ? "Updating..." : "Mark as Shipped"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTrackingDialog(false)
                      setSelectedStatus(actualCurrentStatus)
                      setTrackingId("")
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <select
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={loading}
          className="w-full bg-[#1A1A1B] border border-[#2A2A2B] rounded px-3 py-2 text-sm text-white"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          onClick={() => handleUpdate()}
          disabled={loading || selectedStatus === actualCurrentStatus}
          size="sm"
          className="w-full"
        >
          {loading ? "Updating..." : "Update"}
        </Button>
      </div>

      {/* Tracking ID Dialog */}
      {showTrackingDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#121213] border border-[#1A1A1B] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#F7F7F7]">Enter Tracking ID</h3>
              <button
                onClick={() => {
                  setShowTrackingDialog(false)
                  setSelectedStatus(actualCurrentStatus)
                  setTrackingId("")
                }}
                className="text-[#BDBDBD] hover:text-[#F7F7F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[#BDBDBD] mb-4">
              Tracking ID is required to mark this order as shipped.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tracking-id-full">Tracking ID *</Label>
                <Input
                  id="tracking-id-full"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter tracking number"
                  className="mt-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && trackingId.trim()) {
                      handleTrackingSubmit()
                    }
                  }}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleTrackingSubmit}
                  disabled={loading || !trackingId.trim()}
                  className="flex-1"
                >
                  {loading ? "Updating..." : "Mark as Shipped"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTrackingDialog(false)
                    setSelectedStatus(actualCurrentStatus)
                    setTrackingId("")
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


