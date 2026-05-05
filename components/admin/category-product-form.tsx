"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUploader } from "./image-uploader"

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  sku: z.string().optional(),
  shortDesc: z.string().min(1, "Short description is required"),
  description: z.string().optional(),
  type: z.enum(["STITCHED", "UNSTITCHED", "SEMI_FORMAL", "FORMAL", "HOME", "SHALWAR_KAMEEZ"]),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Valid price required"),
  salePrice: z.string().optional(),
  stock: z.string().refine((val) => !isNaN(parseInt(val)), "Valid stock number required"),
  weight: z.string().optional(),
  tags: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface CategoryProductFormProps {
  product?: any
  categoryId: string
  categorySlug: string
}

export function CategoryProductForm({ product, categoryId, categorySlug }: CategoryProductFormProps) {
  const router = useRouter()
  const [images, setImages] = useState<Array<{ url: string; alt?: string; order: number; isPrimary?: boolean; color?: string }>>(
    product?.images?.map((img: any) => ({
      url: img.url,
      alt: img.alt,
      order: img.order,
      isPrimary: img.isPrimary || img.is_primary,
      color: img.color,
    })) || []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          shortDesc: product.short_desc,
          description: product.description,
          type: product.type,
          gender: product.gender,
          status: product.status,
          price: product.price?.toString(),
          salePrice: product.sale_price?.toString(),
          stock: product.stock?.toString(),
          weight: product.weight?.toString(),
          tags: product.tags?.join(", "),
          seoTitle: product.seo_title,
          seoDesc: product.seo_desc,
          seoKeywords: product.seo_keywords?.join(", "),
          canonicalUrl: product.canonical_url,
        }
      : {
          status: "DRAFT",
          type: "STITCHED",
          gender: "MEN",
        },
  })

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError("")

    try {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
        stock: parseInt(data.stock),
        weight: data.weight ? parseFloat(data.weight) : null,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        seoKeywords: data.seoKeywords ? data.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
        images,
        categoryIds: [categoryId],
      }

      const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products"
      const method = product ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save product")
      }

      router.push(`/admin/categories/${categorySlug}/products`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="slug">Slug (auto-generated if empty)</Label>
          <Input id="slug" {...register("slug")} />
        </div>

        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register("sku")} />
        </div>

        <div>
          <Label htmlFor="shortDesc">Short Description *</Label>
          <Input id="shortDesc" {...register("shortDesc")} />
          {errors.shortDesc && <p className="text-destructive text-sm mt-1">{errors.shortDesc.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">Full Description</Label>
          <textarea
            id="description"
            {...register("description")}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Type *</Label>
            <select
              id="type"
              {...register("type")}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="STITCHED">Stitched</option>
              <option value="UNSTITCHED">Unstitched</option>
              <option value="SEMI_FORMAL">Semi-Formal</option>
              <option value="FORMAL">Formal</option>
              <option value="HOME">Home</option>
              <option value="SHALWAR_KAMEEZ">Shalwar Kameez</option>
            </select>
          </div>

          <div>
            <Label htmlFor="gender">Gender *</Label>
            <select
              id="gender"
              {...register("gender")}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="MEN">Men</option>
              <option value="WOMEN">Women</option>
              <option value="UNISEX">Unisex</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="status">Status *</Label>
          <select
            id="status"
            {...register("status")}
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </section>

      {/* Pricing & Inventory */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Pricing & Inventory</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price *</Label>
            <Input id="price" type="number" step="0.01" {...register("price")} />
            {errors.price && <p className="text-destructive text-sm mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <Label htmlFor="salePrice">Sale Price</Label>
            <Input id="salePrice" type="number" step="0.01" {...register("salePrice")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stock">Stock *</Label>
            <Input id="stock" type="number" {...register("stock")} />
            {errors.stock && <p className="text-destructive text-sm mt-1">{errors.stock.message}</p>}
          </div>

          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input id="weight" type="number" step="0.01" {...register("weight")} />
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Product Images</h2>
        <ImageUploader images={images} onImagesChange={setImages} />
      </section>

      {/* SEO */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>
        
        <div>
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input id="seoTitle" {...register("seoTitle")} />
        </div>

        <div>
          <Label htmlFor="seoDesc">SEO Description</Label>
          <textarea
            id="seoDesc"
            {...register("seoDesc")}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <Label htmlFor="seoKeywords">SEO Keywords (comma-separated)</Label>
          <Input id="seoKeywords" {...register("seoKeywords")} />
        </div>

        <div>
          <Label htmlFor="canonicalUrl">Canonical URL</Label>
          <Input id="canonicalUrl" {...register("canonicalUrl")} />
        </div>

        <div>
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input id="tags" {...register("tags")} />
        </div>
      </section>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

