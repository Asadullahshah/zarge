import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"
import { slugify } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const offset = (page - 1) * limit

    let query = sql`
      SELECT 
        p.*,
        COUNT(DISTINCT pi.id) as image_count,
        COUNT(DISTINCT v.id) as variant_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      LEFT JOIN variants v ON p.id = v.product_id
    `

    if (status) {
      query = sql`
        SELECT 
          p.*,
          COUNT(DISTINCT pi.id) as image_count,
          COUNT(DISTINCT v.id) as variant_count
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        LEFT JOIN variants v ON p.id = v.product_id
        WHERE p.status = ${status}
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      query = sql`
        SELECT 
          p.*,
          COUNT(DISTINCT pi.id) as image_count,
          COUNT(DISTINCT v.id) as variant_count
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        LEFT JOIN variants v ON p.id = v.product_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const products = await query

    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM products
      ${status ? sql`WHERE status = ${status}` : sql``}
    `
    const total = parseInt(countResult[0]?.total || "0")

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Validate and parse numeric fields to prevent overflow
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice > 99999999.99) {
      return NextResponse.json(
        { error: "Price must be between 0.01 and 99,999,999.99" },
        { status: 400 }
      )
    }

    const parsedSalePrice = salePrice ? parseFloat(salePrice) : null
    if (parsedSalePrice !== null && (isNaN(parsedSalePrice) || parsedSalePrice < 0 || parsedSalePrice > 99999999.99)) {
      return NextResponse.json(
        { error: "Sale price must be between 0 and 99,999,999.99" },
        { status: 400 }
      )
    }

    const parsedStock = parseInt(stock)
    if (isNaN(parsedStock) || parsedStock < 0 || parsedStock > 2147483647) {
      return NextResponse.json(
        { error: "Stock must be between 0 and 2,147,483,647" },
        { status: 400 }
      )
    }

    const parsedWeight = weight ? parseFloat(weight) : null
    if (parsedWeight !== null && (isNaN(parsedWeight) || parsedWeight < 0 || parsedWeight > 99999999.99)) {
      return NextResponse.json(
        { error: "Weight must be between 0 and 99,999,999.99" },
        { status: 400 }
      )
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
    
    console.log("AvailableSizes type:", typeof availableSizes, "value:", availableSizes, "Parsed:", parsedAvailableSizes)
    console.log("AvailableColors type:", typeof availableColors, "value:", availableColors, "Parsed:", parsedAvailableColors)
    
    // Format arrays as PostgreSQL array literals: {"value1","value2"}
    const availableSizesArray = parsedAvailableSizes && parsedAvailableSizes.length > 0
      ? `{${parsedAvailableSizes.map(s => `"${String(s).replace(/"/g, '\\"')}"`).join(',')}}`
      : null
    
    const availableColorsArray = parsedAvailableColors && parsedAvailableColors.length > 0
      ? `{${parsedAvailableColors.map(c => `"${String(c).replace(/"/g, '\\"')}"`).join(',')}}`
      : null

    // Generate slug if not provided
    const productSlug = slug || slugify(name)

    // Check if slug exists
    const existing = await sql`
      SELECT id FROM products WHERE slug = ${productSlug}
    `
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Product with this slug already exists" },
        { status: 400 }
      )
    }

    // Insert product
    const result = await sql`
      INSERT INTO products (
        name, slug, sku, short_desc, description, type, gender, status,
        price, sale_price, stock, weight, tags, seo_title, seo_desc,
        seo_keywords, canonical_url, faq_data, piece_count, fabric_type,
        fabric_material, care_instructions, available_sizes, available_colors,
        measurements, country_of_origin, featured
      ) VALUES (
        ${name}, ${productSlug}, ${sku || null}, ${shortDesc || null},
        ${description || null}, ${type || null}, ${gender || null}, ${status || "DRAFT"},
        ${parsedPrice}, ${parsedSalePrice}, ${parsedStock}, ${parsedWeight},
        ${tags && tags.length > 0 ? JSON.stringify(tags) : null}::TEXT[],
        ${seoTitle || null}, ${seoDesc || null},
        ${seoKeywords && seoKeywords.length > 0 ? JSON.stringify(seoKeywords) : null}::TEXT[],
        ${canonicalUrl || null}, ${faqData ? JSON.stringify(faqData) : null},
        ${pieceCount || null}, ${fabricType || null}, ${fabricMaterial || null},
        ${careInstructions || null},
        ${availableSizesArray}::TEXT[],
        ${availableColorsArray}::TEXT[],
        ${measurements ? JSON.stringify(measurements) : null},
        ${countryOfOrigin || 'Pakistan'},
        ${featured !== undefined ? featured : false}
      ) RETURNING *
    `

    const product = result[0]

    // Link categories
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await sql`
          INSERT INTO product_categories (product_id, category_id)
          VALUES (${product.id}, ${categoryId})
          ON CONFLICT DO NOTHING
        `
      }
    }

    // Insert images
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        await sql`
          INSERT INTO product_images (
            product_id, url, alt, "order", width, height, is_primary, color
          ) VALUES (
            ${product.id}, ${img.url}, ${img.alt || null}, ${i}, 
            ${img.width || null}, ${img.height || null}, ${img.isPrimary || false}, ${img.color || null}
          )
        `
      }
    }

    // Create variants with stock for each size/color combination
    if (variantStock && typeof variantStock === 'object') {
      const parsedSizes = parsedAvailableSizes || []
      const parsedColors = parsedAvailableColors || []
      
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

      // Create variants with stock
      for (const combo of combinations) {
        const key = `${combo.size || ''}-${combo.color || ''}`
        const stockValue = variantStock[key] || 0
        
        // Only create variant if stock is set
        if (stockValue > 0) {
          const options: any = {}
          if (combo.size) options.size = combo.size
          if (combo.color) options.color = combo.color
          
          // Generate SKU
          const baseSku = sku || `PROD-${product.id.substring(0, 8)}`
          let variantSku = baseSku
          if (combo.size) variantSku += `-${combo.size.toUpperCase()}`
          if (combo.color) variantSku += `-${combo.color.toUpperCase().replace(/\s+/g, '-')}`
          
          // Ensure unique SKU
          let finalSku = variantSku
          let counter = 1
          while (true) {
            const checkSku = await sql`SELECT id FROM variants WHERE sku = ${finalSku}`
            if (checkSku.length === 0) break
            finalSku = `${variantSku}-${counter}`
            counter++
          }
          
          // Create variant name
          const variantName = [combo.size, combo.color].filter(Boolean).join(" - ") || undefined
          
          await sql`
            INSERT INTO variants (product_id, sku, name, options, price, stock)
            VALUES (
              ${product.id},
              ${finalSku},
              ${variantName || null},
              ${JSON.stringify(options)}::jsonb,
              ${parsedPrice},
              ${stockValue}
            )
            ON CONFLICT (sku) DO UPDATE SET
              stock = ${stockValue},
              updated_at = NOW()
          `
        }
      }
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    )
  }
}

