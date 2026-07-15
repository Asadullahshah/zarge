"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SizeChartUploaderProps {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  uploadType?: string
}

export function SizeChartUploader({ value, onChange, label = "size chart image", uploadType = "size-chart" }: SizeChartUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/upload?type=${uploadType}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      onChange(data.url)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }, [onChange, uploadType])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".avif"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  })

  const removeImage = () => {
    onChange(null)
    setUploadError(null)
  }

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Or Enter Image URL</label>
        <input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://example.com/size-chart.jpg"
          className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
      </div>

      <div className="text-center text-sm text-[#BDBDBD]">OR</div>

      {/* Drag and Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-[#1A1A1B] hover:border-primary"
          }
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[#BDBDBD]">Uploading...</p>
          </div>
        ) : isDragActive ? (
          <div className="space-y-2">
            <Upload className="w-12 h-12 mx-auto text-primary" />
            <p className="text-primary font-semibold">Drop the image here</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-12 h-12 mx-auto text-[#BDBDBD]" />
            <p className="text-[#F7F7F7] font-semibold">
              Drag & drop a {label} here
            </p>
            <p className="text-sm text-[#BDBDBD]">
              or click to select a file
            </p>
            <p className="text-xs text-[#BDBDBD] mt-2">
              Supported: JPG, PNG, WEBP, AVIF (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md text-sm">
          {uploadError}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative border border-[#1A1A1B] rounded-lg p-4 bg-[#0B0B0C]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold mb-2 capitalize">Current {label}:</p>
              <img
                src={value}
                alt="Size Chart Preview"
                className="max-w-full h-auto max-h-96 object-contain rounded border border-[#1A1A1B]"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={removeImage}
              className="flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

