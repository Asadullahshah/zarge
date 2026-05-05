import { neon, Pool } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// Use Neon serverless for edge runtime (App Router server components)
const sql = neon(process.env.DATABASE_URL)

// Use Pool for Node.js runtime (API routes, server actions)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Direct connection for migrations (unpooled)
const sqlDirect = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)

export { sql, pool, sqlDirect }

// Helper function to execute queries (for API routes using Pool)
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

// Helper function for transactions (using Pool)
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

