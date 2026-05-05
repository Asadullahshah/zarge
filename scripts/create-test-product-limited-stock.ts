import dotenv from "dotenv"
import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(process.cwd(), ".env.local") })

const sqlDirect = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!)

async function createTestProduct() {
  try {
    console.log("Creating test product with limited stock...")

    const menCategory = await sqlDirect`
      SELECT id FROM categories WHERE slug = 'men' LIMIT 1
    `
    
    if (menCategory.length === 0) {
      console.error("Men category not found.")
      process.exit(1)
    }

    const menId = menCategory[0].id

    const subcategory = await sqlDirect`
      SELECT id, name, slug FROM categories 
      WHERE parent_id = ${menId} 
      LIMIT 1
    `

    if (subcategory.length === 0) {
      console.error("No men's subcategories found.")
      process.exit(1)
    }

    const subcategoryId = subcategory[0].id
    const subcategoryName = subcategory[0].name

    const productSlug = `test-product-limited-stock-${Date.now()}`
    const productName = "Test Product - Limited Stock (Only Medium Navy Available)"
    
    console.log(`Creating product: ${productName}`)

    const product = await sqlDirect`
      INSERT INTO products (
        name, slug, sku, short_desc, description, type, gender, status,
        price, stock, available_sizes, available_colors
      ) VALUES (
        ${productName},
        ${productSlug},
        ${`TEST-${Date.now()}`},
        ${'Test product for out of stock functionality'},
        ${'This is a test product. Only Medium size in Navy color has 1 item in stock. All other combinations are out of stock.'},
        ${'UNSTITCHED'},
        ${'MEN'},
        ${'PUBLISHED'},
        ${5000.00},
        ${1},
        ${['Small', 'Medium', 'Large', 'XL']}::TEXT[],
        ${['Navy', 'Black', 'Gray']}::TEXT[]
      ) RETURNING id, name, slug
    `

    const productId = product[0].id
    console.log(`Product created: ${product[0].name}`)

    await sqlDirect`
      INSERT INTO product_categories (product_id, category_id)
      VALUES (${productId}, ${subcategoryId})
      ON CONFLICT DO NOTHING
    `

    const sizes = ['Small', 'Medium', 'Large', 'XL']
    const colors = ['Navy', 'Black', 'Gray']
    
    const availableSize = 'Medium'
    const availableColor = 'Navy'
    const variantSku = `TEST-${productId.substring(0, 8)}-M-NAVY`

    await sqlDirect`
      INSERT INTO variants (
        product_id, sku, name, options, price, stock
      ) VALUES (
        ${productId},
        ${variantSku},
        ${`${availableSize} - ${availableColor}`},
        ${JSON.stringify({ size: availableSize, color: availableColor })}::jsonb,
        ${5000.00},
        ${1}
      )
    `
    console.log(`Created variant: ${availableSize} - ${availableColor} (Stock: 1)`)

    for (const size of sizes) {
      for (const color of colors) {
        if (size === availableSize && color === availableColor) continue

        const comboVariantSku = `TEST-${productId.substring(0, 8)}-${size.toUpperCase().substring(0, 1)}-${color.toUpperCase().substring(0, 3)}`
        
        await sqlDirect`
          INSERT INTO variants (
            product_id, sku, name, options, price, stock
          ) VALUES (
            ${productId},
            ${comboVariantSku},
            ${`${size} - ${color}`},
            ${JSON.stringify({ size, color })}::jsonb,
            ${5000.00},
            ${0}
          )
        `
      }
    }

    await sqlDirect`
      INSERT INTO product_images (
        product_id, url, alt, "order", is_primary
      ) VALUES (
        ${productId},
        ${'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'},
        ${productName},
        ${0},
        ${true}
      )
    `

    console.log("\n✅ Test product created successfully!")
    console.log(`\nProduct: ${productName}`)
    console.log(`Slug: ${productSlug}`)
    console.log(`Only Available: Medium - Navy (Stock: 1)`)
    console.log(`All other combinations: Out of Stock`)
    console.log(`\nView at: /product/${productSlug}`)

  } catch (error: any) {
    console.error("Error:", error.message)
    process.exit(1)
  }
}

createTestProduct()
