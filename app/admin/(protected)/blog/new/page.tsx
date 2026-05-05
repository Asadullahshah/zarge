import { requireAuth } from "@/lib/auth-helpers"
import { BlogPostForm } from "@/components/admin/blog-post-form"
import { sql } from "@/lib/db"

export default async function NewBlogPostPage() {
  await requireAuth()

  const categories = await sql`
    SELECT id, name, slug FROM blog_categories ORDER BY name
  `

  const hubPosts = await sql`
    SELECT id, title, slug FROM blog_posts
    WHERE is_hub_post = true AND status = 'PUBLISHED'
    ORDER BY title
  `

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8">New Blog Post</h1>
      <BlogPostForm
        categories={categories as any[]}
        hubPosts={hubPosts as any[]}
      />
    </div>
  )
}

