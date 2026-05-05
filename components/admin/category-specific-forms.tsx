"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUploader } from "./image-uploader"
import { getCategoryFormType, PAKISTANI_SIZES, PAKISTANI_FABRICS, PAKISTANI_COLORS, CARE_INSTRUCTIONS } from "@/lib/category-forms"
import { slugify } from "@/lib/utils"
import { CreatableSelect } from "@/components/ui/creatable-select"

// Base schema that all forms extend
const baseProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  sku: z.string().optional(),
  shortDesc: z.string().min(1, "Short description is required"),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Valid price required"),
  salePrice: z.string().optional(),
  stock: z.string().refine((val) => !isNaN(parseInt(val)), "Valid stock number required"),
  seoTitle: z.preprocess((val) => val === null || val === undefined ? '' : val, z.string().optional()),
  seoDesc: z.preprocess((val) => val === null || val === undefined ? '' : val, z.string().optional()),
  seoKeywords: z.preprocess((val) => val === null || val === undefined ? '' : val, z.string().optional()),
})

interface CategorySpecificFormProps {
  product?: any
  categoryId: string
  categorySlug: string
  categoryName: string
  formType: string
}

export function CategorySpecificForm({ 
  product, 
  categoryId, 
  categorySlug, 
  categoryName,
  formType 
}: CategorySpecificFormProps) {
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

  // Determine gender based on category
  const gender = categorySlug.startsWith('men-') ? 'MEN' : categorySlug.startsWith('women-') ? 'WOMEN' : 'UNISEX'
  const sizes = PAKISTANI_SIZES[gender] || PAKISTANI_SIZES.UNISEX
  const fabrics = formType.includes('home') || formType.includes('bed') || formType.includes('quilt') || formType.includes('pillow') || formType.includes('blanket') || formType.includes('towel') || formType.includes('curtain')
    ? PAKISTANI_FABRICS.HOME
    : gender === 'MEN' 
    ? PAKISTANI_FABRICS.MEN 
    : PAKISTANI_FABRICS.WOMEN

  // Determine product type based on form type
  const getProductType = (): string => {
    if (formType.includes('unstitched')) return 'UNSTITCHED'
    if (formType.includes('stitched')) return 'STITCHED'
    if (formType.includes('formal')) return 'FORMAL'
    if (formType.includes('semi-formal')) return 'SEMI_FORMAL'
    if (formType.includes('home') || formType.includes('bed') || formType.includes('quilt') || 
        formType.includes('pillow') || formType.includes('blanket') || formType.includes('towel') || 
        formType.includes('curtain')) return 'HOME'
    if (formType.includes('bottoms') || formType.includes('dupattas')) return 'SHALWAR_KAMEEZ'
    return 'UNSTITCHED' // Default fallback
  }
  
  const productType = getProductType()

  // Build schema based on form type
  // Always include all fields, but pieceCount is only required for stitched items
  let productSchema = baseProductSchema.extend({
    pieceCount: z.preprocess((val) => val === null || val === undefined || val === '' ? undefined : val, z.enum(["2_PIECE", "3_PIECE"]).optional()),
    fabricType: z.string().optional(),
    fabricMaterial: z.string().optional(),
    careInstructions: z.string().optional(),
    availableSizes: z.array(z.string()).optional(),
    availableColors: z.array(z.string()).optional(),
    measurements: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    countryOfOrigin: z.string().default('Pakistan'),
    featured: z.boolean().optional(),
  })

  type ProductFormData = z.infer<typeof productSchema>

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
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
          status: product.status,
          price: product.price?.toString(),
          salePrice: product.sale_price?.toString(),
          stock: product.stock?.toString(),
          seoTitle: product.seo_title || '',
          seoDesc: product.seo_desc || '',
          seoKeywords: product.seo_keywords?.join(", ") || '',
          pieceCount: product.piece_count || undefined,
          fabricType: product.fabric_type,
          fabricMaterial: product.fabric_material,
          careInstructions: product.care_instructions,
          availableSizes: product.available_sizes || [],
          availableColors: product.available_colors || [],
          measurements: product.measurements || {},
          countryOfOrigin: product.country_of_origin || 'Pakistan',
          featured: product.featured || false,
        }
      : {
          status: "DRAFT",
          countryOfOrigin: 'Pakistan',
          featured: false,
        },
  })

  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    product?.available_sizes || []
  )
  const [selectedColors, setSelectedColors] = useState<string[]>(
    product?.available_colors || []
  )
  const [customSize, setCustomSize] = useState("")
  const [customColor, setCustomColor] = useState("")
  
  // Stock matrix: { "size-color": stock }
  const [variantStock, setVariantStock] = useState<Record<string, number>>(() => {
    // Initialize from existing variants if editing
    if (product?.variants && Array.isArray(product.variants)) {
      const stockMap: Record<string, number> = {}
      product.variants.forEach((variant: any) => {
        const options = typeof variant.options === 'string' 
          ? JSON.parse(variant.options) 
          : (variant.options || {})
        const key = `${options.size || ''}-${options.color || ''}`
        stockMap[key] = variant.stock || 0
      })
      return stockMap
    }
    return {}
  })

  // Update stock matrix when sizes or colors change (clear entries for removed combinations)
  useEffect(() => {
    const currentKeys = Object.keys(variantStock)
    const validKeys = new Set<string>()
    
    // Generate valid keys based on current sizes and colors
    if (selectedSizes.length > 0 && selectedColors.length > 0) {
      selectedSizes.forEach(size => {
        selectedColors.forEach(color => {
          validKeys.add(`${size}-${color}`)
        })
      })
    } else if (selectedSizes.length > 0) {
      selectedSizes.forEach(size => {
        validKeys.add(`${size}`)
      })
    } else if (selectedColors.length > 0) {
      selectedColors.forEach(color => {
        validKeys.add(`-${color}`)
      })
    }
    
    // Remove invalid keys
    const updatedStock: Record<string, number> = {}
    currentKeys.forEach(key => {
      if (validKeys.has(key)) {
        updatedStock[key] = variantStock[key]
      }
    })
    
    if (Object.keys(updatedStock).length !== currentKeys.length) {
      setVariantStock(updatedStock)
    }
  }, [selectedSizes, selectedColors]) // Only run when sizes/colors change, not on every render

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError("")

    try {
      const productSlug = data.slug || slugify(data.name)

      const payload = {
        ...data,
        slug: productSlug,
        type: productType,
        gender: gender,
        price: parseFloat(data.price),
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
        stock: parseInt(data.stock),
        seoKeywords: data.seoKeywords ? data.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
        images,
        categoryIds: [categoryId],
        pieceCount: data.pieceCount || null,
        availableSizes: selectedSizes,
        availableColors: selectedColors,
        variantStock, // Send variant stock matrix
        measurements: data.measurements ? Object.fromEntries(
          Object.entries(data.measurements).map(([key, value]) => [
            key,
            value === null || value === undefined || value === '' 
              ? '' 
              : typeof value === 'number' || typeof value === 'boolean' 
                ? String(value) 
                : value
          ])
        ) : {},
        featured: data.featured || false,
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

  // Render form based on category type
  const renderCategorySpecificFields = () => {
    switch (formType) {
      case 'men-stitched':
      case 'women-stitched':
        return <StitchedFormFields register={register} watch={watch} errors={errors} setValue={setValue} />
      case 'men-unstitched':
      case 'women-unstitched':
        return <UnstitchedFormFields register={register} watch={watch} errors={errors} setValue={setValue} />
      case 'men-formal':
      case 'women-formal':
        return <FormalFormFields register={register} watch={watch} errors={errors} setValue={setValue} />
      case 'men-semi-formal':
        return <SemiFormalFormFields register={register} watch={watch} errors={errors} setValue={setValue} />
      case 'men-winter':
        return <WinterWearFormFields register={register} watch={watch} errors={errors} setValue={setValue} />
      case 'women-bottoms':
        return <BottomsFormFields register={register} watch={watch} errors={errors} setValue={setValue} />
      case 'bed-sheets':
      case 'quilt-comforters':
      case 'pillow-covers':
      case 'blankets':
      case 'towels':
      case 'curtains':
        return <HomeEssentialsFormFields register={register} watch={watch} errors={errors} formType={formType} setValue={setValue} />
      default:
        return null
    }
  }

  return (
    <form 
      onSubmit={handleSubmit(
        onSubmit,
        (errors) => {
          console.log("❌ Validation failed with errors:", errors)
          
          // Prevent browser auto-scroll to invalid fields
          setTimeout(() => {
            // Remove focus from any invalid field to prevent scroll
            const firstErrorField = document.querySelector('input:invalid, select:invalid, textarea:invalid')
            if (firstErrorField) {
              ;(firstErrorField as HTMLElement).blur()
            }
            
            // Scroll to top to show error message
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }, 50)
          
          // Show alert with errors
          const errorMessages = Object.entries(errors)
            .map(([field, error]: [string, any]) => {
              const fieldName = field === 'shortDesc' ? 'Short Description' : 
                               field === 'salePrice' ? 'Sale Price' :
                               field.charAt(0).toUpperCase() + field.slice(1)
              return `${fieldName}: ${error?.message || 'Invalid'}`
            })
            .join('\n')
          
          alert(`⚠️ VALIDATION ERRORS:\n\n${errorMessages}\n\nPlease fill in all required fields marked with * before submitting.`)
          setError(`Validation failed: ${Object.keys(errors).join(', ')}. Please check the form above.`)
        }
      )} 
      className="space-y-8 pb-32"
      noValidate
    >
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
        <h2 className="text-2xl font-serif font-bold mb-4">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Product Name (Urdu/English) *</Label>
            <Input id="name" {...register("name")} placeholder="e.g., Lawn Shirt & Trouser" />
            {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="sku">SKU / Product Code</Label>
            <Input id="sku" {...register("sku")} placeholder="e.g., MEN-ST-001" />
          </div>
        </div>

        <div>
          <Label htmlFor="slug">URL Slug (auto-generated if empty)</Label>
          <Input id="slug" {...register("slug")} />
        </div>

        <div>
          <Label htmlFor="shortDesc">Short Description *</Label>
          <textarea
            id="shortDesc"
            {...register("shortDesc")}
            rows={2}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            placeholder="Brief description for product listing"
          />
          {errors.shortDesc && <p className="text-destructive text-sm mt-1">{errors.shortDesc.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">Detailed Description</Label>
          <textarea
            id="description"
            {...register("description")}
            rows={6}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            placeholder="Full product description, features, and details"
          />
        </div>
      </section>

      {/* Category-Specific Fields */}
      {renderCategorySpecificFields()}

      {/* Fabric & Material */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
        <h2 className="text-2xl font-serif font-bold mb-4">Fabric & Material</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fabricType">Fabric Type</Label>
            <CreatableSelect
              options={fabrics}
              value={watch("fabricType")}
              onChange={(value) => setValue("fabricType", value)}
              placeholder="Select or type new fabric type..."
              allowCustom={true}
            />
          </div>

          <div>
            <Label htmlFor="fabricMaterial">Fabric Material Composition</Label>
            <Input
              id="fabricMaterial"
              {...register("fabricMaterial")}
              placeholder="e.g., 100% Cotton, 60% Cotton 40% Polyester"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="careInstructions">Care Instructions</Label>
          <CreatableSelect
            options={CARE_INSTRUCTIONS}
            value={watch("careInstructions")}
            onChange={(value) => setValue("careInstructions", value)}
            placeholder="Select or type new care instruction..."
            allowCustom={true}
          />
        </div>
      </section>

      {/* Sizes & Colors */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
        <h2 className="text-2xl font-serif font-bold mb-4">Available Sizes & Colors</h2>
        
        <div>
          <Label>Available Sizes (Pakistani Sizes)</Label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-2">
            {sizes.map((size) => (
              <label key={size} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSizes.includes(size)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSizes([...selectedSizes, size])
                    } else {
                      setSelectedSizes(selectedSizes.filter((s) => s !== size))
                    }
                  }}
                  className="rounded border-input"
                />
                <span className="text-sm">{size}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Input
              type="text"
              placeholder="Add custom size..."
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customSize.trim()) {
                  e.preventDefault()
                  if (!selectedSizes.includes(customSize.trim())) {
                    setSelectedSizes([...selectedSizes, customSize.trim()])
                  }
                  setCustomSize("")
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => {
                if (customSize.trim() && !selectedSizes.includes(customSize.trim())) {
                  setSelectedSizes([...selectedSizes, customSize.trim()])
                  setCustomSize("")
                }
              }}
              size="sm"
            >
              Add Size
            </Button>
          </div>
          {selectedSizes.filter(s => !sizes.includes(s)).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedSizes.filter(s => !sizes.includes(s)).map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-sm"
                >
                  {size}
                  <button
                    type="button"
                    onClick={() => setSelectedSizes(selectedSizes.filter((s) => s !== size))}
                    className="hover:text-primary/80"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Available Colors</Label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-2">
            {PAKISTANI_COLORS.map((color) => (
              <label key={color} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedColors([...selectedColors, color])
                    } else {
                      setSelectedColors(selectedColors.filter((c) => c !== color))
                    }
                  }}
                  className="rounded border-input"
                />
                <span className="text-sm">{color}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Input
              type="text"
              placeholder="Add custom color..."
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customColor.trim()) {
                  e.preventDefault()
                  if (!selectedColors.includes(customColor.trim())) {
                    setSelectedColors([...selectedColors, customColor.trim()])
                  }
                  setCustomColor("")
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => {
                if (customColor.trim() && !selectedColors.includes(customColor.trim())) {
                  setSelectedColors([...selectedColors, customColor.trim()])
                  setCustomColor("")
                }
              }}
              size="sm"
            >
              Add Color
            </Button>
          </div>
          {selectedColors.filter(c => !PAKISTANI_COLORS.includes(c)).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedColors.filter(c => !PAKISTANI_COLORS.includes(c)).map((color) => (
                <span
                  key={color}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-sm"
                >
                  {color}
                  <button
                    type="button"
                    onClick={() => setSelectedColors(selectedColors.filter((c) => c !== color))}
                    className="hover:text-primary/80"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Variant Stock Matrix */}
        {(selectedSizes.length > 0 || selectedColors.length > 0) && (
          <div className="mt-6">
            <Label className="text-lg font-semibold mb-4 block">
              Stock by Size & Color
            </Label>
            <p className="text-sm text-[#BDBDBD] mb-4">
              Set stock quantity for each size and color combination. Leave empty or 0 if not available.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#1A1A1B]">
                <thead>
                  <tr className="bg-[#1A1A1B]">
                    <th className="border border-[#1A1A1B] p-3 text-left text-sm font-semibold">Size / Color</th>
                    {selectedColors.map((color) => (
                      <th key={color} className="border border-[#1A1A1B] p-3 text-center text-sm font-semibold min-w-[100px]">
                        {color}
                      </th>
                    ))}
                    {selectedColors.length === 0 && (
                      <th className="border border-[#1A1A1B] p-3 text-center text-sm font-semibold min-w-[100px]">
                        Stock
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedSizes.length > 0 ? (
                    selectedSizes.map((size) => (
                      <tr key={size}>
                        <td className="border border-[#1A1A1B] p-3 font-medium">{size}</td>
                        {selectedColors.length > 0 ? (
                          selectedColors.map((color) => {
                            const key = `${size}-${color}`
                            return (
                              <td key={color} className="border border-[#1A1A1B] p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={variantStock[key] || ''}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                                    setVariantStock({
                                      ...variantStock,
                                      [key]: value
                                    })
                                  }}
                                  className="w-full text-center"
                                  placeholder="0"
                                />
                              </td>
                            )
                          })
                        ) : (
                          <td className="border border-[#1A1A1B] p-2">
                            <Input
                              type="number"
                              min="0"
                              value={variantStock[size] || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                                setVariantStock({
                                  ...variantStock,
                                  [size]: value
                                })
                              }}
                              className="w-full text-center"
                              placeholder="0"
                            />
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border border-[#1A1A1B] p-3 font-medium">All Sizes</td>
                      {selectedColors.map((color) => {
                        const key = `-${color}`
                        return (
                          <td key={color} className="border border-[#1A1A1B] p-2">
                            <Input
                              type="number"
                              min="0"
                              value={variantStock[key] || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                                setVariantStock({
                                  ...variantStock,
                                  [key]: value
                                })
                              }}
                              className="w-full text-center"
                              placeholder="0"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Summary */}
            <div className="mt-4 p-4 bg-[#1A1A1B] rounded-lg">
              <p className="text-sm text-[#BDBDBD]">
                <strong>Total Stock:</strong> {
                  Object.values(variantStock).reduce((sum, stock) => sum + (stock || 0), 0)
                } units across all combinations
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Pricing & Inventory */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
        <h2 className="text-2xl font-serif font-bold mb-4">Pricing & Inventory</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">Price (PKR) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price")}
              placeholder="0.00"
            />
            {errors.price && <p className="text-destructive text-sm mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <Label htmlFor="salePrice">Sale Price (PKR) - Optional</Label>
            <Input
              id="salePrice"
              type="number"
              step="0.01"
              {...register("salePrice")}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="stock">Stock Quantity *</Label>
            <Input
              id="stock"
              type="number"
              {...register("stock")}
              placeholder="0"
            />
            {errors.stock && <p className="text-destructive text-sm mt-1">{errors.stock.message}</p>}
          </div>
        </div>
      </section>

      {/* Product Images */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
        <h2 className="text-2xl font-serif font-bold mb-4">Product Images</h2>
        <ImageUploader 
          images={images} 
          onImagesChange={setImages}
          availableColors={selectedColors}
        />
      </section>

      {/* SEO Settings */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
        <h2 className="text-2xl font-serif font-bold mb-4">SEO Settings</h2>
        
        <div>
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input id="seoTitle" {...register("seoTitle")} />
        </div>

        <div>
          <Label htmlFor="seoDesc">SEO Description</Label>
          <textarea
            id="seoDesc"
            {...register("seoDesc")}
            rows={3}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </div>

        <div>
          <Label htmlFor="seoKeywords">SEO Keywords (comma-separated)</Label>
          <Input id="seoKeywords" {...register("seoKeywords")} placeholder="e.g., lawn, shirt, trouser, pakistani" />
        </div>
      </section>

      {/* Status & Featured */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              {...register("status")}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <Label htmlFor="featured">Featured Product</Label>
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="featured"
                {...register("featured")}
                className="rounded border-input"
              />
              <Label htmlFor="featured" className="text-sm text-[#BDBDBD] cursor-pointer">
                Display on homepage featured section
              </Label>
            </div>
          </div>
        </div>
      </section>

      {/* Fixed Submit Button - Always visible at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B0B0C] border-t border-[#1A1A1B] p-4 z-50 shadow-2xl">
        <div className="flex gap-4 max-w-7xl mx-auto">
          <Button type="submit" disabled={loading} size="lg" className="flex-1">
            {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} size="lg">
            Cancel
          </Button>
        </div>
      </div>
    </form>
  )
}

// Category-specific field components
function StitchedFormFields({ register, watch, errors }: any) {
  return (
    <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
      <h2 className="text-2xl font-serif font-bold mb-4">Stitched Product Details</h2>
      
      <div>
        <Label htmlFor="pieceCount">Piece Count *</Label>
        <select
          id="pieceCount"
          {...register("pieceCount")}
          className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
        >
          <option value="">Select Piece Count</option>
          <option value="2_PIECE">2 Piece (Shirt + Trouser/Pants)</option>
          <option value="3_PIECE">3 Piece (Shirt + Trouser/Pants + Waistcoat)</option>
        </select>
        {errors.pieceCount && <p className="text-destructive text-sm mt-1">{errors.pieceCount.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="chest">Chest Measurement (inches)</Label>
          <Input id="chest" type="number" {...register("measurements.chest")} placeholder="e.g., 40" />
        </div>
        <div>
          <Label htmlFor="waist">Waist Measurement (inches)</Label>
          <Input id="waist" type="number" {...register("measurements.waist")} placeholder="e.g., 36" />
        </div>
        <div>
          <Label htmlFor="shoulder">Shoulder Width (inches)</Label>
          <Input id="shoulder" type="number" {...register("measurements.shoulder")} placeholder="e.g., 18" />
        </div>
        <div>
          <Label htmlFor="sleeve">Sleeve Length (inches)</Label>
          <Input id="sleeve" type="number" {...register("measurements.sleeve")} placeholder="e.g., 24" />
        </div>
        <div>
          <Label htmlFor="length">Shirt Length (inches)</Label>
          <Input id="length" type="number" {...register("measurements.length")} placeholder="e.g., 30" />
        </div>
        <div>
          <Label htmlFor="trouserLength">Trouser Length (inches)</Label>
          <Input id="trouserLength" type="number" {...register("measurements.trouserLength")} placeholder="e.g., 40" />
        </div>
      </div>
    </section>
  )
}

function UnstitchedFormFields({ register, watch, errors }: any) {
  return (
    <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
      <h2 className="text-2xl font-serif font-bold mb-4">Unstitched Product Details</h2>
      
      <div>
        <Label>Fabric Length</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label htmlFor="fabricLengthYards" className="text-sm">Length (Yards)</Label>
            <Input id="fabricLengthYards" type="number" step="0.1" {...register("measurements.fabricLengthYards")} placeholder="e.g., 2.5" />
          </div>
          <div>
            <Label htmlFor="fabricLengthMeters" className="text-sm">Length (Meters)</Label>
            <Input id="fabricLengthMeters" type="number" step="0.1" {...register("measurements.fabricLengthMeters")} placeholder="e.g., 2.3" />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="fabricWidth">Fabric Width (inches)</Label>
        <Input id="fabricWidth" type="number" {...register("measurements.fabricWidth")} placeholder="e.g., 54" />
      </div>

      <div>
        <Label>Fabric Suitability</Label>
        <div className="space-y-2 mt-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" {...register("measurements.suitableForShirt")} className="rounded border-input" />
            <span className="text-sm">Suitable for Shirt</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" {...register("measurements.suitableForTrouser")} className="rounded border-input" />
            <span className="text-sm">Suitable for Trouser</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" {...register("measurements.suitableForKurta")} className="rounded border-input" />
            <span className="text-sm">Suitable for Kurta</span>
          </label>
        </div>
      </div>
    </section>
  )
}

function FormalFormFields({ register, watch, errors, setValue }: any) {
  const fitTypes = ['Slim Fit', 'Regular Fit', 'Loose Fit', 'Tailored']
  const collarTypes = ['Classic', 'Button Down', 'Spread', 'Mandarin']
  const cuffTypes = ['Button Cuff', 'French Cuff', 'Barrel Cuff']
  const pocketTypes = ['No Pocket', 'Chest Pocket', 'Two Pockets']

  return (
    <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
      <h2 className="text-2xl font-serif font-bold mb-4">Formal Wear Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fitType">Fit Type</Label>
          <CreatableSelect
            options={fitTypes}
            value={watch("measurements.fitType") || ""}
            onChange={(value) => setValue("measurements.fitType", value)}
            placeholder="Select or type new fit type..."
            allowCustom={true}
          />
        </div>

        <div>
          <Label htmlFor="collarType">Collar Type</Label>
          <CreatableSelect
            options={collarTypes}
            value={watch("measurements.collarType") || ""}
            onChange={(value) => setValue("measurements.collarType", value)}
            placeholder="Select or type new collar type..."
            allowCustom={true}
          />
        </div>

        <div>
          <Label htmlFor="cuffType">Cuff Type</Label>
          <CreatableSelect
            options={cuffTypes}
            value={watch("measurements.cuffType") || ""}
            onChange={(value) => setValue("measurements.cuffType", value)}
            placeholder="Select or type new cuff type..."
            allowCustom={true}
          />
        </div>

        <div>
          <Label htmlFor="pocketType">Pocket Type</Label>
          <CreatableSelect
            options={pocketTypes}
            value={watch("measurements.pocketType") || ""}
            onChange={(value) => setValue("measurements.pocketType", value)}
            placeholder="Select or type new pocket type..."
            allowCustom={true}
          />
        </div>
      </div>
    </section>
  )
}

function SemiFormalFormFields({ register, watch, errors, setValue }: any) {
  const styles = ['Casual', 'Smart Casual', 'Business Casual', 'Relaxed Fit']
  const patterns = ['Solid', 'Striped', 'Checked', 'Printed', 'Polka Dot']

  return (
    <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
      <h2 className="text-2xl font-serif font-bold mb-4">Semi Formal / Smart Casual Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="style">Style</Label>
          <CreatableSelect
            options={styles}
            value={watch("measurements.style") || ""}
            onChange={(value) => setValue("measurements.style", value)}
            placeholder="Select or type new style..."
            allowCustom={true}
          />
        </div>

        <div>
          <Label htmlFor="pattern">Pattern</Label>
          <CreatableSelect
            options={patterns}
            value={watch("measurements.pattern") || ""}
            onChange={(value) => setValue("measurements.pattern", value)}
            placeholder="Select or type new pattern..."
            allowCustom={true}
          />
        </div>
      </div>
    </section>
  )
}

function WinterWearFormFields({ register, watch, errors, setValue }: any) {
  const warmthLevels = ['Light', 'Medium', 'Heavy', 'Extra Heavy']
  const liningTypes = ['No Lining', 'Cotton Lining', 'Polyester Lining', 'Fleece Lining']

  return (
    <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
      <h2 className="text-2xl font-serif font-bold mb-4">Winter Wear Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="warmthLevel">Warmth Level</Label>
          <CreatableSelect
            options={warmthLevels}
            value={watch("measurements.warmthLevel") || ""}
            onChange={(value) => setValue("measurements.warmthLevel", value)}
            placeholder="Select or type new warmth level..."
            allowCustom={true}
          />
        </div>

        <div>
          <Label htmlFor="lining">Lining Type</Label>
          <CreatableSelect
            options={liningTypes}
            value={watch("measurements.lining") || ""}
            onChange={(value) => setValue("measurements.lining", value)}
            placeholder="Select or type new lining type..."
            allowCustom={true}
          />
        </div>
      </div>
    </section>
  )
}

function BottomsFormFields({ register, watch, errors, setValue }: any) {
  const bottomTypes = ['Trouser', 'Pants', 'Palazzo', 'Shalwar', 'Leggings']

  return (
    <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
      <h2 className="text-2xl font-serif font-bold mb-4">Bottoms & Dupattas Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bottomType">Bottom Type</Label>
          <CreatableSelect
            options={bottomTypes}
            value={watch("measurements.bottomType") || ""}
            onChange={(value) => setValue("measurements.bottomType", value)}
            placeholder="Select or type new bottom type..."
            allowCustom={true}
          />
        </div>

        <div>
          <Label htmlFor="dupattaLength">Dupatta Length (Yards)</Label>
          <Input id="dupattaLength" type="number" step="0.1" {...register("measurements.dupattaLength")} placeholder="e.g., 2.5" />
        </div>

        <div>
          <Label htmlFor="dupattaWidth">Dupatta Width (Yards)</Label>
          <Input id="dupattaWidth" type="number" step="0.1" {...register("measurements.dupattaWidth")} placeholder="e.g., 1.0" />
        </div>
      </div>
    </section>
  )
}

function HomeEssentialsFormFields({ register, watch, errors, formType, setValue }: any) {
  const bedSizes = ['Single', 'Double', 'Queen', 'King']
  const fillingTypes = ['Cotton', 'Polyester', 'Wool', 'Silk']
  const pillowSizes = ['Standard', 'Queen', 'King', 'Euro']
  const thicknessLevels = ['Light', 'Medium', 'Heavy']
  const towelSizes = ['Face Towel', 'Hand Towel', 'Bath Towel', 'Beach Towel']

  return (
    <section className="bg-[#121213] p-6 rounded-lg space-y-4 border border-[#1A1A1B]">
      <h2 className="text-2xl font-serif font-bold mb-4">Home Essentials Details</h2>
      
      {formType === 'bed-sheets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bedSize">Bed Size</Label>
            <CreatableSelect
              options={bedSizes}
              value={watch("measurements.bedSize") || ""}
              onChange={(value) => setValue("measurements.bedSize", value)}
              placeholder="Select or type new bed size..."
              allowCustom={true}
            />
          </div>
          <div>
            <Label htmlFor="threadCount">Thread Count</Label>
            <Input id="threadCount" type="number" {...register("measurements.threadCount")} placeholder="e.g., 200, 300, 400" />
          </div>
        </div>
      )}

      {formType === 'quilt-comforters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quiltSize">Quilt Size</Label>
            <CreatableSelect
              options={bedSizes}
              value={watch("measurements.quiltSize") || ""}
              onChange={(value) => setValue("measurements.quiltSize", value)}
              placeholder="Select or type new quilt size..."
              allowCustom={true}
            />
          </div>
          <div>
            <Label htmlFor="filling">Filling Type</Label>
            <CreatableSelect
              options={fillingTypes}
              value={watch("measurements.filling") || ""}
              onChange={(value) => setValue("measurements.filling", value)}
              placeholder="Select or type new filling type..."
              allowCustom={true}
            />
          </div>
        </div>
      )}

      {formType === 'pillow-covers' && (
        <div>
          <Label htmlFor="pillowSize">Pillow Size</Label>
          <CreatableSelect
            options={pillowSizes}
            value={watch("measurements.pillowSize") || ""}
            onChange={(value) => setValue("measurements.pillowSize", value)}
            placeholder="Select or type new pillow size..."
            allowCustom={true}
          />
        </div>
      )}

      {formType === 'blankets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="blanketSize">Blanket Size</Label>
            <CreatableSelect
              options={bedSizes}
              value={watch("measurements.blanketSize") || ""}
              onChange={(value) => setValue("measurements.blanketSize", value)}
              placeholder="Select or type new blanket size..."
              allowCustom={true}
            />
          </div>
          <div>
            <Label htmlFor="thickness">Thickness</Label>
            <CreatableSelect
              options={thicknessLevels}
              value={watch("measurements.thickness") || ""}
              onChange={(value) => setValue("measurements.thickness", value)}
              placeholder="Select or type new thickness level..."
              allowCustom={true}
            />
          </div>
        </div>
      )}

      {formType === 'towels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="towelSize">Towel Size</Label>
            <CreatableSelect
              options={towelSizes}
              value={watch("measurements.towelSize") || ""}
              onChange={(value) => setValue("measurements.towelSize", value)}
              placeholder="Select or type new towel size..."
              allowCustom={true}
            />
          </div>
          <div>
            <Label htmlFor="towelWeight">Weight (GSM)</Label>
            <Input id="towelWeight" type="number" {...register("measurements.towelWeight")} placeholder="e.g., 400, 600" />
          </div>
        </div>
      )}

      {formType === 'curtains' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="curtainLength">Length (inches)</Label>
            <Input id="curtainLength" type="number" {...register("measurements.curtainLength")} placeholder="e.g., 84" />
          </div>
          <div>
            <Label htmlFor="curtainWidth">Width (inches)</Label>
            <Input id="curtainWidth" type="number" {...register("measurements.curtainWidth")} placeholder="e.g., 54" />
          </div>
        </div>
      )}
    </section>
  )
}

