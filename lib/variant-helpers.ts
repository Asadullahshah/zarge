import { sql } from "./db"

/**
 * Find or create a variant for a product with specific size and color
 * Returns the variant ID
 */
export async function findOrCreateVariant(
  productId: string,
  size: string | null,
  color: string | null,
  productPrice: number
): Promise<string | null> {
  // If no size or color, return null (use product-level stock)
  if (!size && !color) {
    return null
  }

  // Build options object
  const options: any = {}
  if (size) options.size = size
  if (color) options.color = color

  // Try to find existing variant
  const existing = await sql`
    SELECT id FROM variants
    WHERE product_id = ${productId}
      AND options = ${JSON.stringify(options)}::jsonb
    LIMIT 1
  `

  if (existing.length > 0) {
    return existing[0].id
  }

  // Create new variant if it doesn't exist
  // Generate SKU: product_sku-size-color or product_sku-size or product_sku-color
  const product = await sql`
    SELECT sku, name FROM products WHERE id = ${productId}
  `
  
  if (product.length === 0) {
    return null
  }

  const productSku = product[0].sku || `PROD-${productId.substring(0, 8)}`
  const productName = product[0].name || "Product"
  
  let variantSku = productSku
  if (size) variantSku += `-${size.toUpperCase()}`
  if (color) variantSku += `-${color.toUpperCase().replace(/\s+/g, '-')}`
  
  // Ensure unique SKU
  let finalSku = variantSku
  let counter = 1
  while (true) {
    const checkSku = await sql`
      SELECT id FROM variants WHERE sku = ${finalSku}
    `
    if (checkSku.length === 0) break
    finalSku = `${variantSku}-${counter}`
    counter++
  }

  // Create variant name
  const variantName = [size, color].filter(Boolean).join(" - ") || undefined

  const newVariant = await sql`
    INSERT INTO variants (product_id, sku, name, options, price, stock)
    VALUES (
      ${productId},
      ${finalSku},
      ${variantName || null},
      ${JSON.stringify(options)}::jsonb,
      ${productPrice},
      0  -- Default stock to 0, admin needs to set it
    )
    RETURNING id
  `

  return newVariant[0].id
}

/**
 * Get variant stock for a specific size/color combination
 */
export async function getVariantStock(
  productId: string,
  size: string | null,
  color: string | null
): Promise<number> {
  if (!size && !color) {
    // Return product stock if no variant
    const product = await sql`
      SELECT stock FROM products WHERE id = ${productId}
    `
    return product[0]?.stock || 0
  }

  const filter: any = {}
  if (size) filter.size = size
  if (color) filter.color = color

  // Use containment (@>) rather than exact equality so a partial selection
  // (only size, or only color) still matches variants that also carry the
  // other attribute, and sum across all matches for that partial selection.
  const matches = await sql`
    SELECT stock FROM variants
    WHERE product_id = ${productId}
      AND options @> ${JSON.stringify(filter)}::jsonb
  `

  if (matches.length === 0) {
    // If variant doesn't exist, return 0 (needs to be created with stock)
    return 0
  }

  return matches.reduce((sum: number, row: any) => sum + (row.stock || 0), 0)
}



