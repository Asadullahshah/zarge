"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

interface PasswordUpdateFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function PasswordUpdateForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PasswordUpdateFormData>()

  const newPassword = watch("newPassword")

  const onSubmit = async (data: PasswordUpdateFormData) => {
    setLoading(true)
    setSuccess(false)
    setError("")

    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      setError("New passwords do not match")
      setLoading(false)
      return
    }

    // Validate password length
    if (data.newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/admin/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        setError("")
        reset()
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError(result.error || "Failed to update password")
      }
    } catch (error: any) {
      setError("An error occurred. Please try again.")
      console.error("Error updating password:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#121213] p-6 rounded-lg space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Change Password</h2>
        <p className="text-sm text-[#BDBDBD]">Update your admin account password</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-md">
          Password updated successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              {...register("currentPassword", { required: "Current password is required" })}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD] hover:text-[#F7F7F7]"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-sm text-red-400 mt-1">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              {...register("newPassword", {
                required: "New password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long",
                },
              })}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD] hover:text-[#F7F7F7]"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-400 mt-1">{errors.newPassword.message}</p>
          )}
          <p className="text-xs text-[#BDBDBD] mt-1">Must be at least 8 characters long</p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Please confirm your new password",
                validate: (value) =>
                  value === newPassword || "Passwords do not match",
              })}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDBDBD] hover:text-[#F7F7F7]"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-400 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  )
}



