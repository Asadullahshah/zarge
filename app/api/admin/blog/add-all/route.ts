import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth-helpers"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

export async function POST() {
  try {
    const session = await requireAuth()
    const authorId = session.user.id

    // Read all JSON files from data/blog-posts directory
    const postsDir = join(process.cwd(), 'data', 'blog-posts')
    
    if (!readdirSync) {
      return NextResponse.json(
        { error: "File system operations not available" },
        { status: 500 }
      )
    }
    
    const files = readdirSync(postsDir).filter(f => f.endsWith('.json')).sort()
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No blog post files found in data/blog-posts directory" },
        { status: 404 }
      )
    }

    const createdPosts: any[] = []
    const hubPostMap: Record<string, string> = {}
    const errors: string[] = []

    // First pass: Create all posts
    for (const filename of files) {
      try {
        const filePath = join(postsDir, filename)
        const postData = JSON.parse(readFileSync(filePath, 'utf-8'))

        // Check if post already exists
        const existing = await sql`
          SELECT id FROM blog_posts WHERE slug = ${postData.slug}
        `
        
        if (existing.length > 0) {
          const existingPost = existing[0]
          createdPosts.push(existingPost)
          if (postData.isHubPost) {
            hubPostMap[postData.hubTopic || ''] = existingPost.id
          }
          continue
        }

        // Format keywords as PostgreSQL array literal: {"keyword1","keyword2"}
        const keywordsArray = postData.seoKeywords && postData.seoKeywords.length > 0
          ? postData.seoKeywords
          : null

        // Format as PostgreSQL array literal (curly braces, not square brackets)
        const keywordsValue = keywordsArray
          ? `{${keywordsArray.map((k: string) => `"${k.replace(/"/g, '\\"')}"`).join(',')}}`
          : null

        // Insert post - handle keywords array properly
        const result = keywordsValue
          ? await sql`
              INSERT INTO blog_posts (
                title, slug, excerpt, content, status,
                is_hub_post, hub_topic, seo_title, seo_desc, seo_keywords,
                author_id, published_at
              ) VALUES (
                ${postData.title}, ${postData.slug}, ${postData.excerpt || null}, ${postData.content}, 'PUBLISHED',
                ${postData.isHubPost || false}, ${postData.hubTopic || null},
                ${postData.seoTitle || null}, ${postData.seoDesc || null},
                ${keywordsValue}::TEXT[],
                ${authorId}, NOW()
              ) RETURNING *
            `
          : await sql`
              INSERT INTO blog_posts (
                title, slug, excerpt, content, status,
                is_hub_post, hub_topic, seo_title, seo_desc, seo_keywords,
                author_id, published_at
              ) VALUES (
                ${postData.title}, ${postData.slug}, ${postData.excerpt || null}, ${postData.content}, 'PUBLISHED',
                ${postData.isHubPost || false}, ${postData.hubTopic || null},
                ${postData.seoTitle || null}, ${postData.seoDesc || null},
                NULL,
                ${authorId}, NOW()
              ) RETURNING *
            `

        const createdPost = result[0]
        createdPosts.push(createdPost)
        
        if (postData.isHubPost) {
          hubPostMap[postData.hubTopic || ''] = createdPost.id
        }
      } catch (error: any) {
        const errorMsg = `Error processing ${filename}: ${error.message}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    // Second pass: Link spoke posts to hub posts
    for (let i = 0; i < files.length; i++) {
      try {
        const filename = files[i]
        const filePath = join(postsDir, filename)
        const postData = JSON.parse(readFileSync(filePath, 'utf-8'))
        const createdPost = createdPosts[i]

        if (!postData.isHubPost && postData.hubTopic && hubPostMap[postData.hubTopic]) {
          const hubPostId = hubPostMap[postData.hubTopic]
          
          await sql`
            UPDATE blog_posts
            SET related_posts = ARRAY[${hubPostId}]::UUID[]
            WHERE id = ${createdPost.id}
          `
        }
      } catch (error: any) {
        const errorMsg = `Error linking ${files[i]}: ${error.message}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdPosts.length} blog posts`,
      summary: {
        total: createdPosts.length,
        hubPosts: Object.keys(hubPostMap).length,
        spokePosts: createdPosts.length - Object.keys(hubPostMap).length
      },
      posts: createdPosts.map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        isHubPost: p.is_hub_post
      })),
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error("Error adding blog posts:", error)
    return NextResponse.json(
      { error: error.message || "Failed to add blog posts" },
      { status: 500 }
    )
  }
}

