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
import { ProductType, Gender, ProductStatus } from "@/lib/types"

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  sku: z.string().optional(),
  shortDesc: z.string().min(1, "Short description is required"),
  description: z.string().optional(),
  type: z.enum(["STITCHED", "UNSTITCHED", "SEMI_FORMAL", "FORMAL", "HOME", "SHALWAR_KAMEEZ"]),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  price: z.string().refine((val) => {
    if (!val || val.trim() === '') return false
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Price is required and must be greater than 0"),
  salePrice: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true // Optional field
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, "Sale price must be a valid number"),
  stock: z.string().refine((val) => {
    if (!val || val.trim() === '') return false
    const num = parseInt(val)
    return !isNaN(num) && num >= 0
  }, "Stock is required and must be a valid number (0 or greater)"),
  weight: z.string().optional(),
  tags: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: any
  categories: Array<{ id: string; name: string; slug: string }>
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const [images, setImages] = useState<Array<{ url: string; alt?: string; order: number; isPrimary?: boolean; color?: string; isHomeMobile?: boolean; isHomeDesktop?: boolean }>>(
    product?.images?.map((img: any) => ({
      url: img.url,
      alt: img.alt,
      order: img.order,
      isPrimary: img.isPrimary || img.is_primary,
      color: img.color,
      isHomeMobile: img.isHomeMobile ?? img.is_home_mobile ?? false,
      isHomeDesktop: img.isHomeDesktop ?? img.is_home_desktop ?? false,
    })) || []
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product?.categories?.map((c: any) => c.id) || []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
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
    console.log("=== ONSUBMIT CALLED ===")
    console.log("Form submitted with data:", data)
    console.log("Form errors:", errors)
    setLoading(true)
    setError("")
    
    console.log("Making API call...")

    try {
      const payload = {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        shortDesc: data.shortDesc,
        description: data.description,
        type: data.type,
        gender: data.gender,
        status: data.status,
        price: parseFloat(data.price),
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
        stock: parseInt(data.stock),
        weight: data.weight ? parseFloat(data.weight) : null,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        seoTitle: data.seoTitle,
        seoDesc: data.seoDesc,
        seoKeywords: data.seoKeywords ? data.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
        canonicalUrl: data.canonicalUrl,
        images,
        categoryIds: selectedCategories,
      }

      const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products"
      const method = product ? "PUT" : "POST"

      console.log("=== MAKING API CALL ===")
      console.log("URL:", url)
      console.log("Method:", method)
      console.log("Payload:", payload)

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error("Product creation error:", responseData)
        throw new Error(responseData.error || "Failed to save product")
      }

      // Show success alert
      if (product) {
        alert("Product updated successfully!")
      } else {
        alert("Product created successfully!")
      }

      // Small delay to ensure alert is seen
      setTimeout(() => {
        router.push("/admin/products")
        router.refresh()
      }, 100)
    } catch (err: any) {
      console.error("Error in product form:", err)
      setError(err.message || "An error occurred while saving the product")
      alert(`Error: ${err.message || "Failed to save product. Please check the form and try again."}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = handleSubmit(
    (data) => {
      console.log("=== VALIDATION PASSED ===")
      console.log("✅ Validation passed, submitting:", data)
      onSubmit(data)
    },
    (errors) => {
      console.log("❌ Validation failed with errors:", errors)
      console.log("Form values at validation failure:", watch())
      
      const errorMessages = Object.entries(errors)
        .map(([field, error]: [string, any]) => {
          const fieldName = field === 'shortDesc' ? 'Short Description' : 
                           field === 'salePrice' ? 'Sale Price' :
                           field.charAt(0).toUpperCase() + field.slice(1)
          return `${fieldName}: ${error?.message || 'Invalid'}`
        })
        .join('\n')
      
      // Prevent browser auto-scroll to invalid fields
      // Instead, scroll to top to show error banner
      setTimeout(() => {
        // Prevent any auto-scroll by the browser
        const firstErrorField = document.querySelector('input:invalid, select:invalid, textarea:invalid')
        if (firstErrorField) {
          // Remove focus from invalid field to prevent scroll
          ;(firstErrorField as HTMLElement).blur()
        }
        
        // Scroll to top to show error banner instead
        window.scrollTo({ top: 0, behavior: 'smooth' })
        const errorBanner = document.getElementById('validation-errors')
        if (errorBanner) {
          setTimeout(() => {
            errorBanner.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }
      }, 50)
      
      // Show alert with errors
      alert(`⚠️ VALIDATION ERRORS:\n\n${errorMessages}\n\nPlease fill in all required fields marked with * before submitting.`)
      
      // Set error state to show error message in UI
      setError(`Validation failed: ${Object.keys(errors).join(', ')}. Please check the form above.`)
    }
  )

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log("=== FORM ONSUBMIT EVENT TRIGGERED ===")
        handleFormSubmit(e)
        return false
      }} 
      className="space-y-8" 
      noValidate
    >
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}
      
      {/* Display validation errors - Always visible when errors exist */}
      {Object.keys(errors).length > 0 && (
        <div 
          id="validation-errors"
          className="bg-red-500/20 border-4 border-red-500 text-red-300 p-6 rounded-md mb-6 sticky top-4 z-50 shadow-2xl"
          style={{ animation: 'pulse 2s infinite' }}
        >
          <p className="font-bold text-xl mb-3 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            VALIDATION ERRORS - Please fix before submitting:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base font-semibold">
            {errors.name && <li className="text-red-200">❌ Product Name: {errors.name.message}</li>}
            {errors.shortDesc && <li className="text-red-200">❌ Short Description: {errors.shortDesc.message}</li>}
            {errors.price && <li className="text-red-200">❌ Price: {errors.price.message}</li>}
            {errors.stock && <li className="text-red-200">❌ Stock: {errors.stock.message}</li>}
            {errors.type && <li className="text-red-200">❌ Type: {errors.type.message}</li>}
            {errors.gender && <li className="text-red-200">❌ Gender: {errors.gender.message}</li>}
            {errors.status && <li className="text-red-200">❌ Status: {errors.status.message}</li>}
          </ul>
          <p className="mt-4 text-sm text-red-200">
            💡 Tip: All fields marked with * are required. Please fill them in before clicking &quot;Create Product&quot;.
          </p>
        </div>
      )}

      {/* Basic Information */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input 
            id="name" 
            {...register("name")} 
            placeholder="Enter product name"
          />
          {errors.name && <p className="text-destructive text-sm mt-1 font-semibold">{errors.name.message}</p>}
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
          <Input 
            id="shortDesc" 
            {...register("shortDesc")} 
            placeholder="Brief product description"
          />
          {errors.shortDesc && <p className="text-destructive text-sm mt-1 font-semibold">{errors.shortDesc.message}</p>}
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

      {/* Categories */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategories([...selectedCategories, category.id])
                  } else {
                    setSelectedCategories(selectedCategories.filter((id) => id !== category.id))
                  }
                }}
                className="rounded border-input"
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Images */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Product Images</h2>
        <ImageUploader 
          images={images} 
          onImagesChange={setImages}
          availableColors={product?.available_colors || []}
        />
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
        <Button 
          type="button"
          onClick={(e) => {
            console.log("=== CREATE PRODUCT BUTTON CLICKED ===")
            const formValues = watch()
            console.log("Form values:", formValues)
            console.log("Form errors:", errors)
            console.log("Loading state:", loading)
            console.log("Has name:", !!formValues.name)
            console.log("Has shortDesc:", !!formValues.shortDesc)
            console.log("Has price:", !!formValues.price)
            console.log("Has stock:", !!formValues.stock)
            console.log("Triggering form validation and submission...")
            // Manually trigger form submission
            handleFormSubmit()
          }}
          disabled={loading}
        >
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

