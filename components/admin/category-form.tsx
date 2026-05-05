"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SizeChartUploader } from "./size-chart-uploader"

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  sizeChartImage: z.string().optional(),
  parentId: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormProps {
  category?: any
  parentCategories: Array<{ id: string; name: string; slug: string }>
}

export function CategoryForm({ category, parentCategories }: CategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sizeChartImageUrl, setSizeChartImageUrl] = useState<string | null>(
    category?.size_chart_image || null
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          sizeChartImage: category.size_chart_image,
          parentId: category.parent_id,
        }
      : {},
  })

  const parentId = watch("parentId")
  const isSubcategory = !!parentId || !!category?.parent_id

  // Update form value when size chart image changes
  const handleSizeChartChange = (url: string | null) => {
    setSizeChartImageUrl(url)
    setValue("sizeChartImage", url || "")
  }

  const onSubmit = async (data: CategoryFormData) => {
    setLoading(true)
    setError("")

    try {
      const url = category ? `/api/admin/categories/${category.id}` : "/api/admin/categories"
      const method = category ? "PUT" : "POST"

      // Include the size chart image URL from state
      const formData = {
        ...data,
        sizeChartImage: sizeChartImageUrl || data.sizeChartImage || null,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save category")
      }

      router.push("/admin/categories")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-[#121213] p-6 rounded-lg space-y-4">
        <div>
          <Label htmlFor="name">Category Name *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="slug">Slug (auto-generated if empty)</Label>
          <Input id="slug" {...register("slug")} />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            {...register("description")}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <Label htmlFor="image">Image URL</Label>
          <Input id="image" {...register("image")} />
        </div>

        <div>
          <Label htmlFor="parentId">Parent Category</Label>
          <select
            id="parentId"
            {...register("parentId")}
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">None</option>
            {parentCategories
              .filter((c) => !category || c.id !== category.id)
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>

        {/* Size Chart Image - Only for subcategories */}
        {isSubcategory && (
          <div>
            <Label>Size Chart Image</Label>
            <p className="text-sm text-[#BDBDBD] mt-1 mb-4">
              Upload a size chart image that will be displayed on all products in this subcategory.
            </p>
            <SizeChartUploader
              value={sizeChartImageUrl}
              onChange={handleSizeChartChange}
            />
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : category ? "Update Category" : "Create Category"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

