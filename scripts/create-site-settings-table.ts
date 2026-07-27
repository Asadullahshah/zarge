import dotenv from "dotenv"
import { neon } from "@neondatabase/serverless"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const sqlDirect = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!)

async function createSiteSettingsTable() {
  try {
    if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
      console.error("❌ Error: DATABASE_URL or DATABASE_URL_UNPOOLED must be set in .env.local")
      process.exit(1)
    }

    console.log("Creating site_settings table...")

    await sqlDirect`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT false,
        message TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    console.log("Creating trigger...")
    await sqlDirect`
      CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `

    console.log("Seeding default promo_banner row...")
    await sqlDirect`
      INSERT INTO site_settings (key, enabled, message)
      VALUES ('promo_banner', true, '🎉 WEBSITE LAUNCH • 50% OFF SITEWIDE FOR FIRST 50 CUSTOMERS!')
      ON CONFLICT (key) DO NOTHING
    `

    console.log("✅ site_settings table created successfully!")
    process.exit(0)
  } catch (error: any) {
    console.error("❌ Error creating site_settings table:", error.message)
    if (error.message?.includes("already exists")) {
      console.log("✅ site_settings table already exists - skipping creation")
      process.exit(0)
    }
    process.exit(1)
  }
}

createSiteSettingsTable()
