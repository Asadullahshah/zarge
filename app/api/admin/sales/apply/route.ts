import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const { percentage, target, categoryId } = body

    // Validate input
    if (!percentage || typeof percentage !== "number" || percentage <= 0 || percentage >= 100) {
      return NextResponse.json(
        { error: "Invalid sale percentage. Must be between 1 and 99." },
        { status: 400 }
      )
    }

    if (!target || !["INVENTORY", "MAIN_CATEGORY", "SUBCATEGORY"].includes(target)) {
      return NextResponse.json(
        { error: "Invalid sale target. Must be INVENTORY, MAIN_CATEGORY, or SUBCATEGORY." },
        { status: 400 }
      )
    }

    if (target !== "INVENTORY" && !categoryId) {
      return NextResponse.json(
        { error: "Category ID is required for category-based sales." },
        { status: 400 }
      )
    }

    // Calculate discount multiplier (e.g., 0.83 for 17% off)
    const discountMultiplier = 1 - percentage / 100

    let productIds: string[] = []
    let updatedCount = 0

    if (target === "INVENTORY") {
      // Get all published products
      const products = await sql`
        SELECT id, price, sale_price
        FROM products
        WHERE status = 'PUBLISHED'
      `
      productIds = products.map((p: any) => p.id)
    } else if (target === "MAIN_CATEGORY") {
      // Get all products in the main category and its subcategories
      // Use a subquery to get products in the main category or any of its subcategories
      const products = await sql`
        SELECT DISTINCT p.id, p.price, p.sale_price
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE p.status = 'PUBLISHED'
          AND pc.category_id IN (
            SELECT id FROM categories WHERE id = ${categoryId} OR parent_id = ${categoryId}
          )
      `
      productIds = products.map((p: any) => p.id)
    } else if (target === "SUBCATEGORY") {
      // Get all products in the specific subcategory
      const products = await sql`
        SELECT DISTINCT p.id, p.price, p.sale_price
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE p.status = 'PUBLISHED'
          AND pc.category_id = ${categoryId}
      `
      productIds = products.map((p: any) => p.id)
    }

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: "No products found to apply sale to." },
        { status: 404 }
      )
    }

    // Update each product's sale_price
    // IMPORTANT: This will REPLACE any existing sale_price with the new calculated sale price
    // The sale price is always calculated from the ORIGINAL price (price column), not from any existing sale_price
    // Example: If product has price=1000, sale_price=800 (20% off), and admin applies 10% sale:
    //          New sale_price = 1000 * 0.90 = 900 (the previous 800 is replaced)
    for (const productId of productIds) {
      // Get the product's ORIGINAL price (always use price column, ignore existing sale_price)
      const product = await sql`
        SELECT price, sale_price
        FROM products
        WHERE id = ${productId}
        LIMIT 1
      `

      if (product.length === 0) continue

      const originalPrice = parseFloat(product[0].price)
      if (isNaN(originalPrice) || originalPrice <= 0) continue

      // Calculate new sale price based on ORIGINAL price (this replaces any existing sale_price)
      const newSalePrice = Math.round(originalPrice * discountMultiplier * 100) / 100

      // Update the product - this REPLACES any previous sale_price
      await sql`
        UPDATE products
        SET sale_price = ${newSalePrice}
        WHERE id = ${productId}
      `

      updatedCount++
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Sale applied successfully to ${updatedCount} products.`,
    })
  } catch (error: any) {
    console.error("Error applying sale:", error)
    return NextResponse.json(
      { error: error.message || "Failed to apply sale." },
      { status: 500 }
    )
  }
}

