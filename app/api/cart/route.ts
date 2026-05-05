import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { findOrCreateVariant, getVariantStock } from "@/lib/variant-helpers"

function getSessionId() {
  const cookieStore = cookies()
  let sessionId = cookieStore.get("cart_session")?.value

  if (!sessionId) {
    sessionId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    cookieStore.set("cart_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  return sessionId
}

export async function GET() {
  try {
    const sessionId = getSessionId()

    const cart = await sql`
      SELECT * FROM carts WHERE session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (cart.length === 0) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const cartData = cart[0]

    const items = await sql`
      SELECT 
        ci.*,
        p.name as product_name,
        p.slug as product_slug,
        p.price as product_price,
        p.sale_price as product_sale_price,
        json_agg(
          json_build_object(
            'url', pi.url,
            'alt', pi.alt,
            'isPrimary', pi.is_primary
          )
        ) FILTER (WHERE pi.id IS NOT NULL) as images
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE ci.cart_id = ${cartData.id}
      GROUP BY ci.id, p.id
      ORDER BY ci.created_at ASC
    `

    let total = 0
    const formattedItems = items.map((item: any) => {
      const price = parseFloat(item.product_sale_price || item.product_price)
      const itemTotal = price * item.quantity
      total += itemTotal
      return {
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        productName: item.product_name,
        productSlug: item.product_slug,
        quantity: item.quantity,
        price,
        total: itemTotal,
        images: item.images || [],
      }
    })

    return NextResponse.json({
      items: formattedItems,
      total,
    })
  } catch (error: any) {
    console.error("Error fetching cart:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch cart" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, variantId, quantity = 1, size, color } = body

    console.log("Add to cart request:", { productId, variantId, quantity, size, color })

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const sessionId = getSessionId()
    console.log("Session ID:", sessionId)

    // Get or create cart
    let cart = await sql`
      SELECT * FROM carts WHERE session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (cart.length === 0) {
      const newCart = await sql`
        INSERT INTO carts (session_id)
        VALUES (${sessionId})
        RETURNING *
      `
      cart = newCart
    }

    const cartId = cart[0].id

    // Get product details
    const product = await sql`
      SELECT id, stock, price FROM products WHERE id = ${productId}
    `
    
    if (product.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    const productData = product[0]
    const sizeValue: string | null = size ? String(size) : null
    const colorValue: string | null = color ? String(color) : null

    // Find or create variant for this size/color combination
    let finalVariantId = variantId
    if (!finalVariantId && (sizeValue || colorValue)) {
      finalVariantId = await findOrCreateVariant(
        productId,
        sizeValue,
        colorValue,
        parseFloat(productData.price)
      )
    }

    // Get stock for this specific variant (or product if no variant)
    const variantStock = finalVariantId
      ? await sql`SELECT stock FROM variants WHERE id = ${finalVariantId}`
      : null
    
    const currentStock = variantStock && variantStock.length > 0
      ? variantStock[0].stock || 0
      : productData.stock || 0

    // Check if item already exists in this cart (same product, variant, size, and color)
    const existingItem = finalVariantId
      ? await sql`
          SELECT * FROM cart_items
          WHERE cart_id = ${cartId} 
            AND product_id = ${productId} 
            AND variant_id = ${finalVariantId}
        `
      : await sql`
          SELECT * FROM cart_items
          WHERE cart_id = ${cartId} 
            AND product_id = ${productId} 
            AND variant_id IS NULL 
            AND (size IS NOT DISTINCT FROM ${sizeValue})
            AND (color IS NOT DISTINCT FROM ${colorValue})
        `

    const existingQty = existingItem[0]?.quantity || 0
    let newQuantity = quantity
    if (existingItem.length > 0) {
      newQuantity = existingQty + quantity
    }

    // Calculate available stock: current stock + items already in cart for this specific variant
    const availableStock = currentStock + existingQty

    // Check if we have enough stock for the NEW quantity
    if (newQuantity > availableStock) {
      return NextResponse.json(
        { error: `Only ${availableStock} items available in stock for this ${sizeValue || ''} ${colorValue || ''} combination. You already have ${existingQty} in your cart.` },
        { status: 400 }
      )
    }

    // Update stock (variant or product)
    const stockToSubtract = quantity
    
    if (finalVariantId) {
      // Update variant stock
      const stockUpdate = await sql`
        UPDATE variants
        SET stock = GREATEST(0, stock - ${stockToSubtract}), updated_at = NOW()
        WHERE id = ${finalVariantId} AND stock >= ${stockToSubtract}
        RETURNING stock
      `
      
      if (stockUpdate.length === 0) {
        return NextResponse.json(
          { error: `Insufficient stock. Only ${availableStock} items available.` },
          { status: 400 }
        )
      }
    } else {
      // Update product stock
      const stockUpdate = await sql`
        UPDATE products
        SET stock = GREATEST(0, stock - ${stockToSubtract}), updated_at = NOW()
        WHERE id = ${productId} AND stock >= ${stockToSubtract}
        RETURNING stock, name
      `
      
      if (stockUpdate.length === 0) {
        return NextResponse.json(
          { error: `Insufficient stock. Only ${availableStock} items available.` },
          { status: 400 }
        )
      }
    }

    // Then, add/update cart item
    if (existingItem.length > 0) {
      // Update quantity
      await sql`
        UPDATE cart_items
        SET quantity = quantity + ${quantity}, updated_at = NOW()
        WHERE id = ${existingItem[0].id}
      `
    } else {
      // Add new item
      await sql`
        INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, size, color)
        VALUES (${cartId}, ${productId}, ${finalVariantId || null}, ${quantity}, ${sizeValue}, ${colorValue})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error adding to cart:", error)
    return NextResponse.json(
      { error: error.message || "Failed to add to cart" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      )
    }

    // Get cart item to restore stock
    const cartItem = await sql`
      SELECT product_id, variant_id, quantity FROM cart_items WHERE id = ${itemId}
    `

    if (cartItem.length > 0) {
      const { product_id, variant_id, quantity } = cartItem[0]
      
      // Restore stock (variant or product)
      if (variant_id) {
        await sql`
          UPDATE variants
          SET stock = stock + ${quantity}, updated_at = NOW()
          WHERE id = ${variant_id}
        `
      } else {
        await sql`
          UPDATE products
          SET stock = stock + ${quantity}, updated_at = NOW()
          WHERE id = ${product_id}
        `
      }
    }

    await sql`DELETE FROM cart_items WHERE id = ${itemId}`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error removing from cart:", error)
    return NextResponse.json(
      { error: error.message || "Failed to remove from cart" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, quantity } = body

    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { error: "Item ID and quantity are required" },
        { status: 400 }
      )
    }

    // Get current cart item
    const cartItem = await sql`
      SELECT product_id, variant_id, quantity as current_quantity FROM cart_items WHERE id = ${itemId}
    `

    if (cartItem.length === 0) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      )
    }

    const { product_id, variant_id, current_quantity } = cartItem[0]

    // Get stock (variant or product)
    let availableStock = 0
    if (variant_id) {
      const variant = await sql`
        SELECT stock FROM variants WHERE id = ${variant_id}
      `
      availableStock = variant[0]?.stock || 0
    } else {
      const product = await sql`
        SELECT stock FROM products WHERE id = ${product_id}
      `
      availableStock = product[0]?.stock || 0
    }

    if (quantity <= 0) {
      // Restore stock before deleting
      if (variant_id) {
        await sql`
          UPDATE variants
          SET stock = stock + ${current_quantity}, updated_at = NOW()
          WHERE id = ${variant_id}
        `
      } else {
        await sql`
          UPDATE products
          SET stock = stock + ${current_quantity}, updated_at = NOW()
          WHERE id = ${product_id}
        `
      }
      await sql`DELETE FROM cart_items WHERE id = ${itemId}`
    } else {
      // Calculate stock difference
      const quantityDiff = quantity - current_quantity

      // Check if we have enough stock for the increase
      if (quantityDiff > 0 && quantityDiff > availableStock) {
        return NextResponse.json(
          { error: `Only ${availableStock} additional items available in stock` },
          { status: 400 }
        )
      }

      // Update cart item quantity
      await sql`
        UPDATE cart_items
        SET quantity = ${quantity}, updated_at = NOW()
        WHERE id = ${itemId}
      `

      // Update stock (variant or product) - subtract if increased, add if decreased
      if (quantityDiff !== 0) {
        if (variant_id) {
          await sql`
            UPDATE variants
            SET stock = stock - ${quantityDiff}, updated_at = NOW()
            WHERE id = ${variant_id}
          `
        } else {
          await sql`
            UPDATE products
            SET stock = stock - ${quantityDiff}, updated_at = NOW()
            WHERE id = ${product_id}
          `
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating cart:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update cart" },
      { status: 500 }
    )
  }
}

