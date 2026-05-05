import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Check if any published products have a sale_price
    const result = await sql`
      SELECT COUNT(*) as count
      FROM products
      WHERE status = 'PUBLISHED' AND sale_price IS NOT NULL AND sale_price > 0
    `
    
    const hasSale = parseInt(result[0]?.count || '0') > 0
    
    return NextResponse.json({ hasSale })
  } catch (error: any) {
    console.error('Error checking for sales:', error)
    return NextResponse.json({ hasSale: false })
  }
}


