import { sql } from "@/lib/db"

/**
 * Processes products to calculate correct stock and filter available sizes based on variants
 */
export async function processProductsWithVariants(products: any[]): Promise<any[]> {
  if (products.length === 0) return products

  const productIds = products.map(p => p.id)
  
  if (productIds.length === 0) return products

  // Fetch all variants for these products - use individual queries if array doesn't work
  let allVariants: any[] = []
  if (productIds.length === 1) {
    allVariants = await sql`
      SELECT product_id, options, stock
      FROM variants
      WHERE product_id = ${productIds[0]}
    `
  } else {
    // For multiple products, query them in batches or use IN clause
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',')
    // Use a simpler approach: query one by one or use a subquery
    // Actually, let's use a loop for reliability
    for (const pid of productIds) {
      const variants = await sql`
        SELECT product_id, options, stock
        FROM variants
        WHERE product_id = ${pid}
      `
      allVariants.push(...variants)
    }
  }

  // Group variants by product_id
  const variantsByProduct = new Map<string, any[]>()
  for (const variant of allVariants) {
    const pid = variant.product_id
    if (!variantsByProduct.has(pid)) {
      variantsByProduct.set(pid, [])
    }
    variantsByProduct.get(pid)!.push(variant)
  }

  // Process each product
  return products.map(product => {
    const variants = variantsByProduct.get(product.id) || []
    
    // If product has variants, calculate stock from variants
    let finalStock = product.stock || 0
    let availableSizes = product.available_sizes || []
    
    if (variants.length > 0) {
      // Calculate total stock from variants
      const totalVariantStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      finalStock = totalVariantStock

      // Filter available sizes to only include sizes that have at least one variant with stock > 0
      const sizesWithStock = new Set<string>()
      for (const variant of variants) {
        if (variant.stock > 0) {
          try {
            const options = typeof variant.options === 'string' 
              ? JSON.parse(variant.options) 
              : variant.options
            const size = options?.size
            if (size && typeof size === 'string') {
              sizesWithStock.add(size.trim())
            }
          } catch (e) {
            // Skip invalid variant options
          }
        }
      }
      
      // If no variants have stock, set availableSizes to empty array
      if (sizesWithStock.size === 0) {
        availableSizes = []
      } else if (availableSizes && availableSizes.length > 0) {
        // Only keep sizes that have stock
        availableSizes = availableSizes.filter((size: string) => 
          Array.from(sizesWithStock).some(stockedSize => 
            stockedSize.toLowerCase() === size.toLowerCase()
          )
        )
      }
    } else {
      // If no variants and product stock is 0, clear available sizes
      if (finalStock === 0 && availableSizes && availableSizes.length > 0) {
        availableSizes = []
      }
    }

    return {
      ...product,
      stock: finalStock,
      available_sizes: availableSizes,
    }
  })
}

