import dotenv from "dotenv"
import { neon } from "@neondatabase/serverless"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const sqlDirect = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!)

async function createDiscountCodesTable() {
  try {
    if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
      console.error("❌ Error: DATABASE_URL or DATABASE_URL_UNPOOLED must be set in .env.local")
      process.exit(1)
    }

    console.log("Creating discount_codes table...")
    await sqlDirect`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED')),
        value DECIMAL(10, 2) NOT NULL CHECK (value > 0),
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    console.log("Creating index...")
    await sqlDirect`
      CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code)
    `

    console.log("Creating trigger...")
    try {
      await sqlDirect`
        CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `
    } catch (err: any) {
      if (!err.message?.includes("already exists")) throw err
      console.log("⊘ Trigger already exists - skipping")
    }

    console.log("Adding discount columns to orders table...")
    await sqlDirect`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT`
    await sqlDirect`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0`

    console.log("✅ discount_codes table and orders columns created successfully!")
    process.exit(0)
  } catch (error: any) {
    console.error("❌ Error creating discount_codes table:", error.message)
    process.exit(1)
  }
}

createDiscountCodesTable()
