import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const category = searchParams.get("category")
    const gender = searchParams.get("gender")
    const type = searchParams.get("type")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const search = searchParams.get("search")
    const offset = (page - 1) * limit
    const searchPattern = search ? `%${search}%` : null

    let products: any[]
    let countResult: any[]

    // Build query based on filters - NO nested SQL fragments
    if (category) {
      // Query with category filter
      if (searchPattern) {
        // With search - build complete query
        if (gender && type && minPrice && maxPrice) {
          products = await sql`
            SELECT 
              p.*,
              json_agg(
                DISTINCT jsonb_build_object(
                  'url', pi.url,
                  'alt', pi.alt,
                  'isPrimary', pi.is_primary,
                  'order', pi."order"
                )
              ) FILTER (WHERE pi.id IS NOT NULL) as images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            INNER JOIN product_categories pc ON p.id = pc.product_id
            INNER JOIN categories c ON pc.category_id = c.id
            WHERE p.status = 'PUBLISHED' AND c.slug = ${category}
              AND (p.name ILIKE ${searchPattern} OR p.short_desc ILIKE ${searchPattern})
              AND p.gender = ${gender}
              AND p.type = ${type}
              AND p.price >= ${parseFloat(minPrice)}
              AND p.price <= ${parseFloat(maxPrice)}
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        } else if (gender && type && minPrice) {
          products = await sql`
            SELECT 
              p.*,
              json_agg(
                DISTINCT jsonb_build_object(
                  'url', pi.url,
                  'alt', pi.alt,
                  'isPrimary', pi.is_primary,
                  'order', pi."order"
                )
              ) FILTER (WHERE pi.id IS NOT NULL) as images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            INNER JOIN product_categories pc ON p.id = pc.product_id
            INNER JOIN categories c ON pc.category_id = c.id
            WHERE p.status = 'PUBLISHED' AND c.slug = ${category}
              AND (p.name ILIKE ${searchPattern} OR p.short_desc ILIKE ${searchPattern})
              AND p.gender = ${gender}
              AND p.type = ${type}
              AND p.price >= ${parseFloat(minPrice)}
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        } else if (gender && type) {
          products = await sql`
            SELECT 
              p.*,
              json_agg(
                DISTINCT jsonb_build_object(
                  'url', pi.url,
                  'alt', pi.alt,
                  'isPrimary', pi.is_primary,
                  'order', pi."order"
                )
              ) FILTER (WHERE pi.id IS NOT NULL) as images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            INNER JOIN product_categories pc ON p.id = pc.product_id
            INNER JOIN categories c ON pc.category_id = c.id
            WHERE p.status = 'PUBLISHED' AND c.slug = ${category}
              AND (p.name ILIKE ${searchPattern} OR p.short_desc ILIKE ${searchPattern})
              AND p.gender = ${gender}
              AND p.type = ${type}
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        } else if (gender) {
          products = await sql`
            SELECT 
              p.*,
              json_agg(
                DISTINCT jsonb_build_object(
                  'url', pi.url,
                  'alt', pi.alt,
                  'isPrimary', pi.is_primary,
                  'order', pi."order"
                )
              ) FILTER (WHERE pi.id IS NOT NULL) as images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            INNER JOIN product_categories pc ON p.id = pc.product_id
            INNER JOIN categories c ON pc.category_id = c.id
            WHERE p.status = 'PUBLISHED' AND c.slug = ${category}
              AND (p.name ILIKE ${searchPattern} OR p.short_desc ILIKE ${searchPattern})
              AND p.gender = ${gender}
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        } else {
          // Just search, no other filters
          products = await sql`
            SELECT 
              p.*,
              json_agg(
                DISTINCT jsonb_build_object(
                  'url', pi.url,
                  'alt', pi.alt,
                  'isPrimary', pi.is_primary,
                  'order', pi."order"
                )
              ) FILTER (WHERE pi.id IS NOT NULL) as images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            INNER JOIN product_categories pc ON p.id = pc.product_id
            INNER JOIN categories c ON pc.category_id = c.id
            WHERE p.status = 'PUBLISHED' AND c.slug = ${category}
              AND (p.name ILIKE ${searchPattern} OR p.short_desc ILIKE ${searchPattern})
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        }
        // Count query with search
        countResult = await sql`
          SELECT COUNT(DISTINCT p.id) as total
          FROM products p
          INNER JOIN product_categories pc ON p.id = pc.product_id
          INNER JOIN categories c ON pc.category_id = c.id
          WHERE p.status = 'PUBLISHED' AND c.slug = ${category}
            AND (p.name ILIKE ${searchPattern} OR p.short_desc ILIKE ${searchPattern})
        `
      } else {
        // Without search
        products = await sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order"
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          INNER JOIN product_categories pc ON p.id = pc.product_id
          INNER JOIN categories c ON pc.category_id = c.id
          WHERE p.status = 'PUBLISHED' AND c.slug = ${category}
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        countResult = await sql`
          SELECT COUNT(DISTINCT p.id) as total
          FROM products p
          INNER JOIN product_categories pc ON p.id = pc.product_id
          INNER JOIN categories c ON pc.category_id = c.id
          WHERE p.status = 'PUBLISHED' AND c.slug = ${category}
        `
      }
    } else {
      // Query without category filter
      if (searchPattern) {
        // With search - simple query like search page
        products = await sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order"
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          WHERE p.status = 'PUBLISHED'
            AND (p.name ILIKE ${searchPattern} OR p.short_desc ILIKE ${searchPattern})
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM products
          WHERE status = 'PUBLISHED'
            AND (name ILIKE ${searchPattern} OR short_desc ILIKE ${searchPattern})
        `
      } else {
        // Without search
        products = await sql`
          SELECT 
            p.*,
            json_agg(
              DISTINCT jsonb_build_object(
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary,
                'order', pi."order"
              )
            ) FILTER (WHERE pi.id IS NOT NULL) as images
          FROM products p
          LEFT JOIN product_images pi ON p.id = pi.product_id
          WHERE p.status = 'PUBLISHED'
          GROUP BY p.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        countResult = await sql`
          SELECT COUNT(*) as total
          FROM products
          WHERE status = 'PUBLISHED'
        `
      }
    }

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
