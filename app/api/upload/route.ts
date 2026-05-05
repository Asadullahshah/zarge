import { NextRequest, NextResponse } from "next/server"
import { uploadImage } from "@/lib/blob"
import { requireAuth } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split(".").pop()
    
    // Check if this is a size chart upload (can be determined by query param or use default)
    const requestUrl = new URL(request.url)
    const uploadType = requestUrl.searchParams.get("type") || "products"
    const folder = uploadType === "size-chart" ? "size-charts" : "products"
    const filename = `${folder}/${timestamp}-${random}.${extension}`

    // Upload to Vercel Blob
    const imageUrl = await uploadImage(file, filename)

    return NextResponse.json({ url: imageUrl, filename })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    )
  }
}

