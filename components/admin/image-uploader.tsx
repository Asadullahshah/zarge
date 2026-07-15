"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

type UploaderImage = {
  id?: string
  url: string
  alt?: string
  order: number
  isPrimary?: boolean
  color?: string
  isHomeMobile?: boolean
  isHomeDesktop?: boolean
}

interface ImageUploaderProps {
  images: UploaderImage[]
  onImagesChange: (images: UploaderImage[]) => void
  availableColors?: string[]
}

export function ImageUploader({ images, onImagesChange, availableColors = [] }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    const newImages = [...images]

    for (const file of acceptedFiles) {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        // Auto-assign first color if only one color is available
        const autoColor = availableColors.length === 1 ? availableColors[0] : undefined
        newImages.push({
          url: data.url,
          alt: file.name,
          order: newImages.length,
          isPrimary: newImages.length === 0,
          color: autoColor,
        })
      } catch (error) {
        console.error("Upload error:", error)
      }
    }

    onImagesChange(newImages)
    setUploading(false)
  }, [images, onImagesChange, availableColors])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".avif"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    // Reorder
    newImages.forEach((img, i) => {
      img.order = i
      if (i === 0) img.isPrimary = true
      else img.isPrimary = false
    })
    onImagesChange(newImages)
  }

  const setPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }))
    onImagesChange(newImages)
  }

  // Only one image can be the home (mobile) / home (desktop) image — toggle on click
  const setHomeMobile = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isHomeMobile: i === index ? !img.isHomeMobile : false,
    }))
    onImagesChange(newImages)
  }

  const setHomeDesktop = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isHomeDesktop: i === index ? !img.isHomeDesktop : false,
    }))
    onImagesChange(newImages)
  }

  const updateAlt = (index: number, alt: string) => {
    const newImages = [...images]
    newImages[index].alt = alt
    onImagesChange(newImages)
  }

  const updateColor = (index: number, color: string) => {
    const newImages = [...images]
    newImages[index].color = color || undefined
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-[#1A1A1B] hover:border-[#BFA36A]"
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-[#BDBDBD]" />
        {uploading ? (
          <p className="text-[#BDBDBD]">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-primary">Drop images here</p>
        ) : (
          <div>
            <p className="text-[#F7F7F7] mb-2">
              Drag & drop images here, or click to select
            </p>
            <p className="text-sm text-[#BDBDBD]">
              JPEG, PNG, WebP, AVIF (max 10MB)
            </p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group bg-[#1A1A1B] rounded-lg overflow-hidden"
            >
              <div className="aspect-square relative">
                <Image
                  src={image.url}
                  alt={image.alt || `Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  {image.isPrimary && (
                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                      Primary
                    </div>
                  )}
                  {image.isHomeDesktop && (
                    <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      Home · Desktop
                    </div>
                  )}
                  {image.isHomeMobile && (
                    <div className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      Home · Mobile
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Alt text"
                  value={image.alt || ""}
                  onChange={(e) => updateAlt(index, e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#1A1A1B] rounded px-2 py-1 text-sm"
                />
                <div>
                  <label className="block text-xs text-[#BDBDBD] mb-1">
                    Color Tag {availableColors.length > 0 ? '*' : ''}
                  </label>
                  {availableColors.length > 0 ? (
                    <select
                      value={image.color || ""}
                      onChange={(e) => updateColor(index, e.target.value)}
                      className="w-full bg-[#0B0B0C] border border-[#1A1A1B] rounded px-2 py-1 text-sm focus:border-primary focus:outline-none"
                      required
                    >
                      <option value="">Select Color *</option>
                      {availableColors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter color name"
                      value={image.color || ""}
                      onChange={(e) => updateColor(index, e.target.value)}
                      className="w-full bg-[#0B0B0C] border border-[#1A1A1B] rounded px-2 py-1 text-sm"
                    />
                  )}
                  {image.color && (
                    <span className="text-xs text-primary mt-1 block">
                      ✓ Tagged: {image.color}
                    </span>
                  )}
                </div>
                {!image.isPrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setPrimary(index)}
                  >
                    Set as Primary
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={image.isHomeDesktop ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs px-1"
                    onClick={() => setHomeDesktop(index)}
                  >
                    {image.isHomeDesktop ? "✓ Home (Desktop)" : "Set Home (Desktop)"}
                  </Button>
                  <Button
                    type="button"
                    variant={image.isHomeMobile ? "default" : "outline"}
                    size="sm"
                    className="flex-1 text-xs px-1"
                    onClick={() => setHomeMobile(index)}
                  >
                    {image.isHomeMobile ? "✓ Home (Mobile)" : "Set Home (Mobile)"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

