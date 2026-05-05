import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"
import { slugify } from "@/lib/utils"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await sql`
      SELECT * FROM products WHERE id = ${params.id}
    `

    if (product.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const [productData] = product

    // Get images
    const images = await sql`
      SELECT * FROM product_images
      WHERE product_id = ${params.id}
      ORDER BY "order" ASC
    `

    // Get variants
    const variants = await sql`
      SELECT * FROM variants
      WHERE product_id = ${params.id}
      ORDER BY created_at ASC
    `

    // Get categories
    const categories = await sql`
      SELECT c.* FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ${params.id}
    `

    return NextResponse.json({
      ...productData,
      images,
      variants,
      categories,
    })
  } catch (error: any) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch product" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const body = await request.json()
    const {
      name,
      slug,
      sku,
      shortDesc,
      description,
      type,
      gender,
      pieceCount,
      fabricType,
      fabricMaterial,
      careInstructions,
      availableSizes,
      availableColors,
      variantStock, // Stock matrix for size/color combinations
      measurements,
      countryOfOrigin,
      featured,
      status,
      price,
      salePrice,
      stock,
      weight,
      tags,
      seoTitle,
      seoDesc,
      seoKeywords,
      canonicalUrl,
      faqData,
      categoryIds,
      images,
    } = body

    // Check if this is a partial update (e.g., only featured status)
    // A partial update is when only 'featured' is provided
    const isPartialUpdate = featured !== undefined && Object.keys(body).length === 1 && body.hasOwnProperty('featured')

    // Validate and parse numeric fields only if they're provided
    let parsedPrice: number | undefined = undefined
    if (price !== undefined) {
      parsedPrice = parseFloat(price)
      if (isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice > 99999999.99) {
        return NextResponse.json(
          { error: "Price must be between 0.01 and 99,999,999.99" },
          { status: 400 }
        )
      }
    }

    let parsedSalePrice: number | null | undefined = undefined
    if (salePrice !== undefined) {
      parsedSalePrice = salePrice ? parseFloat(salePrice) : null
      if (parsedSalePrice !== null && (isNaN(parsedSalePrice) || parsedSalePrice < 0 || parsedSalePrice > 99999999.99)) {
        return NextResponse.json(
          { error: "Sale price must be between 0 and 99,999,999.99" },
          { status: 400 }
        )
      }
    }

    let parsedStock: number | undefined = undefined
    if (stock !== undefined) {
      parsedStock = parseInt(stock)
      if (isNaN(parsedStock) || parsedStock < 0 || parsedStock > 2147483647) {
        return NextResponse.json(
          { error: "Stock must be between 0 and 2,147,483,647" },
          { status: 400 }
        )
      }
    }

    let parsedWeight: number | null | undefined = undefined
    if (weight !== undefined) {
      parsedWeight = weight ? parseFloat(weight) : null
      if (parsedWeight !== null && (isNaN(parsedWeight) || parsedWeight < 0 || parsedWeight > 99999999.99)) {
        return NextResponse.json(
          { error: "Weight must be between 0 and 99,999,999.99" },
          { status: 400 }
        )
      }
    }

    // Ensure arrays are actually arrays (not strings)
    let parsedAvailableSizes: string[] | null = null
    if (availableSizes) {
      if (Array.isArray(availableSizes)) {
        parsedAvailableSizes = availableSizes.filter(s => s && s.trim())
      } else if (typeof availableSizes === 'string' && availableSizes.trim()) {
        try {
          // Handle case where it might be double-stringified
          let parsed = availableSizes
          if (parsed.startsWith('"') && parsed.endsWith('"')) {
            parsed = JSON.parse(parsed)
          }
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed)
          }
          parsedAvailableSizes = Array.isArray(parsed) ? parsed.filter(s => s && s.trim()) : null
        } catch {
          parsedAvailableSizes = null
        }
      }
    }
    
    let parsedAvailableColors: string[] | null = null
    if (availableColors) {
      if (Array.isArray(availableColors)) {
        parsedAvailableColors = availableColors.filter(c => c && c.trim())
      } else if (typeof availableColors === 'string' && availableColors.trim()) {
        try {
          // Handle case where it might be double-stringified
          let parsed = availableColors
          if (parsed.startsWith('"') && parsed.endsWith('"')) {
            parsed = JSON.parse(parsed)
          }
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed)
          }
          parsedAvailableColors = Array.isArray(parsed) ? parsed.filter(c => c && c.trim()) : null
        } catch {
          parsedAvailableColors = null
        }
      }
    }
    
    console.log("AvailableSizes:", availableSizes, "Parsed:", parsedAvailableSizes)
    console.log("AvailableColors:", availableColors, "Parsed:", parsedAvailableColors)
    
    // Format arrays as PostgreSQL array literals: {"value1","value2"}
    const availableSizesArray = parsedAvailableSizes && parsedAvailableSizes.length > 0
      ? `{${parsedAvailableSizes.map(s => `"${String(s).replace(/"/g, '\\"')}"`).join(',')}}`
      : null
    
    const availableColorsArray = parsedAvailableColors && parsedAvailableColors.length > 0
      ? `{${parsedAvailableColors.map(c => `"${String(c).replace(/"/g, '\\"')}"`).join(',')}}`
      : null

    // Check if product exists
    const existing = await sql`
      SELECT id FROM products WHERE id = ${params.id}
    `
    if (existing.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Handle partial updates - only update fields that are provided
    if (isPartialUpdate) {
      // Simple featured status update
      await sql`
        UPDATE products SET
          featured = ${featured},
          updated_at = NOW()
        WHERE id = ${params.id}
      `
    } else {
      // Full update - validate required fields
      if (!name) {
        return NextResponse.json({ error: "Product name is required" }, { status: 400 })
      }

      // Generate slug if not provided
      const productSlug = slug || slugify(name)

      // Check if slug exists for another product
      const slugCheck = await sql`
        SELECT id FROM products WHERE slug = ${productSlug} AND id != ${params.id}
      `
      if (slugCheck.length > 0) {
        return NextResponse.json(
          { error: "Product with this slug already exists" },
          { status: 400 }
        )
      }

      // Update product
      await sql`
        UPDATE products SET
          name = ${name},
          slug = ${productSlug},
          sku = ${sku || null},
          short_desc = ${shortDesc || null},
          description = ${description || null},
          type = ${type || null},
          gender = ${gender || null},
          status = ${status || "DRAFT"},
          price = ${parsedPrice},
          sale_price = ${parsedSalePrice},
          stock = ${parsedStock},
          weight = ${parsedWeight},
          tags = ${tags && tags.length > 0 ? JSON.stringify(tags) : null}::TEXT[],
          seo_title = ${seoTitle || null},
          seo_desc = ${seoDesc || null},
          seo_keywords = ${seoKeywords && seoKeywords.length > 0 ? JSON.stringify(seoKeywords) : null}::TEXT[],
          canonical_url = ${canonicalUrl || null},
          faq_data = ${faqData ? JSON.stringify(faqData) : null},
          piece_count = ${pieceCount || null},
          fabric_type = ${fabricType || null},
          fabric_material = ${fabricMaterial || null},
          care_instructions = ${careInstructions || null},
          available_sizes = ${availableSizesArray}::TEXT[],
          available_colors = ${availableColorsArray}::TEXT[],
          measurements = ${measurements ? JSON.stringify(measurements) : null},
          country_of_origin = ${countryOfOrigin || 'Pakistan'},
          featured = ${featured !== undefined ? featured : false},
          updated_at = NOW()
        WHERE id = ${params.id}
      `

      // Update categories only if provided
      if (categoryIds !== undefined) {
        await sql`DELETE FROM product_categories WHERE product_id = ${params.id}`
        if (categoryIds && categoryIds.length > 0) {
          for (const categoryId of categoryIds) {
            await sql`
              INSERT INTO product_categories (product_id, category_id)
              VALUES (${params.id}, ${categoryId})
            `
          }
        }
      }

      // Update images only if provided
      if (images !== undefined) {
        await sql`DELETE FROM product_images WHERE product_id = ${params.id}`
        if (images && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            const img = images[i]
            await sql`
              INSERT INTO product_images (
                product_id, url, alt, "order", width, height, is_primary, color
              ) VALUES (
                ${params.id}, ${img.url}, ${img.alt || null}, ${i}, 
                ${img.width || null}, ${img.height || null}, ${img.isPrimary || false}, ${img.color || null}
              )
            `
          }
        }
      }
    }

    // Update variants with stock if variantStock is provided
    if (variantStock !== undefined && variantStock && typeof variantStock === 'object') {
      // Get current sizes and colors
      const currentProduct = await sql`SELECT available_sizes, available_colors, price, sku FROM products WHERE id = ${params.id}`
      const productData = currentProduct[0]
      
      const parsedSizes = parsedAvailableSizes || (productData?.available_sizes || [])
      const parsedColors = parsedAvailableColors || (productData?.available_colors || [])
      const productPrice = parsedPrice || parseFloat(productData?.price || '0')
      const productSku = sku || productData?.sku || `PROD-${params.id.substring(0, 8)}`
      
      // Delete existing variants for this product (we'll recreate them)
      await sql`DELETE FROM variants WHERE product_id = ${params.id}`
      
      // Generate all combinations
      const combinations: Array<{ size: string | null; color: string | null }> = []
      
      if (parsedSizes.length > 0 && parsedColors.length > 0) {
        // Size + Color combinations
        for (const size of parsedSizes) {
          for (const color of parsedColors) {
            combinations.push({ size, color })
          }
        }
      } else if (parsedSizes.length > 0) {
        // Size only
        for (const size of parsedSizes) {
          combinations.push({ size, color: null })
        }
      } else if (parsedColors.length > 0) {
        // Color only
        for (const color of parsedColors) {
          combinations.push({ size: null, color })
        }
      }

      // Create/update variants with stock
      for (const combo of combinations) {
        const key = `${combo.size || ''}-${combo.color || ''}`
        const stockValue = variantStock[key] || 0
        
        // Only create variant if stock is set
        if (stockValue > 0) {
          const options: any = {}
          if (combo.size) options.size = combo.size
          if (combo.color) options.color = combo.color
          
          // Generate SKU
          let variantSku = productSku
          if (combo.size) variantSku += `-${combo.size.toUpperCase()}`
          if (combo.color) variantSku += `-${combo.color.toUpperCase().replace(/\s+/g, '-')}`
          
          // Ensure unique SKU
          let finalSku = variantSku
          let counter = 1
          while (true) {
            const checkSku = await sql`SELECT id FROM variants WHERE sku = ${finalSku} AND product_id != ${params.id}`
            if (checkSku.length === 0) break
            finalSku = `${variantSku}-${counter}`
            counter++
          }
          
          // Create variant name
          const variantName = [combo.size, combo.color].filter(Boolean).join(" - ") || undefined
          
          await sql`
            INSERT INTO variants (product_id, sku, name, options, price, stock)
            VALUES (
              ${params.id},
              ${finalSku},
              ${variantName || null},
              ${JSON.stringify(options)}::jsonb,
              ${productPrice},
              ${stockValue}
            )
          `
        }
      }
    }

    const updated = await sql`
      SELECT * FROM products WHERE id = ${params.id}
    `

    return NextResponse.json({ product: updated[0] })
  } catch (error: any) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    await sql`DELETE FROM products WHERE id = ${params.id}`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    )
  }
}

