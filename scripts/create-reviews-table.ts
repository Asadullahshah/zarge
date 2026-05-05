import dotenv from "dotenv"
import { neon } from "@neondatabase/serverless"
import path from "path"

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

// Use direct connection for scripts
const sqlDirect = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!)

async function createReviewsTable() {
  try {
    if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
      console.error("❌ Error: DATABASE_URL or DATABASE_URL_UNPOOLED must be set in .env.local")
      process.exit(1)
    }

    console.log("Creating reviews table...")
    
    await sqlDirect`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_name TEXT NOT NULL,
        user_email TEXT,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    console.log("Creating indexes...")
    await sqlDirect`CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)`
    await sqlDirect`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`
    await sqlDirect`CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)`
    await sqlDirect`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)`
    await sqlDirect`CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at)`
    
    console.log("Creating trigger...")
    await sqlDirect`
      CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `
    
    console.log("✅ Reviews table created successfully!")
    process.exit(0)
  } catch (error: any) {
    console.error("❌ Error creating reviews table:", error.message)
    if (error.message?.includes("already exists")) {
      console.log("✅ Reviews table already exists - skipping creation")
      process.exit(0)
    }
    process.exit(1)
  }
}

createReviewsTable()

