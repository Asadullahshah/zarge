import { sql } from "../lib/db"
import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

// Use direct connection for scripts
const sqlDirect = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!)

async function createAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4] || "Admin"

  if (!email || !password) {
    console.error("Usage: tsx scripts/create-admin.ts <email> <password> [name]")
    process.exit(1)
  }

  try {
    // Check if user exists
    const existing = await sqlDirect`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existing.length > 0) {
      console.error("User with this email already exists")
      process.exit(1)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const result = await sqlDirect`
      INSERT INTO users (email, password, name, role)
      VALUES (${email}, ${hashedPassword}, ${name}, 'ADMIN')
      RETURNING id, email, name, role
    `

    console.log("Admin user created successfully:")
    console.log(result[0])
  } catch (error: any) {
    console.error("Error creating admin user:", error.message)
    process.exit(1)
  }
}

createAdmin()

