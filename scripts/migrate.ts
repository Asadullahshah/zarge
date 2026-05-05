import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join } from 'path'

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!)

async function migrate() {
  try {
    const migrationSQL = readFileSync(
      join(process.cwd(), 'scripts', 'schema.sql'),
      'utf-8'
    )
    
    // Remove comments
    let cleanedSQL = migrationSQL
      .replace(/--.*$/gm, '') // Remove single-line comments
    
    // Split by semicolons, but handle dollar-quoted strings (functions)
    const statements: string[] = []
    let currentStatement = ''
    let inDollarQuote = false
    let dollarTag = ''
    
    for (let i = 0; i < cleanedSQL.length; i++) {
      const char = cleanedSQL[i]
      currentStatement += char
      
      // Check for dollar quote start
      if (char === '$' && !inDollarQuote) {
        const rest = cleanedSQL.substring(i)
        const match = rest.match(/^\$([^$]*)\$/)
        if (match) {
          inDollarQuote = true
          dollarTag = match[0]
          i += match[0].length - 1
          currentStatement = currentStatement.slice(0, -1) + match[0]
          continue
        }
      }
      
      // Check for dollar quote end
      if (inDollarQuote && cleanedSQL.substring(i).startsWith(dollarTag)) {
        i += dollarTag.length - 1
        currentStatement = currentStatement.slice(0, -1) + dollarTag
        inDollarQuote = false
        dollarTag = ''
        continue
      }
      
      // If we hit a semicolon and we're not in a dollar quote, end the statement
      if (char === ';' && !inDollarQuote) {
        const trimmed = currentStatement.trim()
        if (trimmed.length > 0) {
          statements.push(trimmed)
        }
        currentStatement = ''
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim())
    }

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await sql(statement)
          console.log('✓ Executed:', statement.substring(0, 60).replace(/\s+/g, ' ') + '...')
        } catch (err: any) {
          // Skip if already exists
          if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
            console.log('⊘ Skipped (already exists):', statement.substring(0, 60).replace(/\s+/g, ' ') + '...')
          } else {
            throw err
          }
        }
      }
    }

    console.log('✓ Migration completed successfully')
  } catch (error: any) {
    console.error('✗ Migration failed:', error.message)
    process.exit(1)
  }
}

migrate()

