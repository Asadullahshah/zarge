import { sql } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog | Zarge",
  description: "Fashion tips, style guides, and insights from Zarge",
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string; category?: string }
}) {
  const page = parseInt(searchParams.page || "1")
  const limit = 12
  const offset = (page - 1) * limit

  // Build query based on category filter
  let posts: any[]
  let countResult: any[]

  if (searchParams.category) {
    posts = await sql`
      SELECT 
        bp.*,
        u.name as author_name
      FROM blog_posts bp
      INNER JOIN blog_post_categories bpc ON bp.id = bpc.post_id
      INNER JOIN blog_categories bc ON bpc.category_id = bc.id
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.status = 'PUBLISHED' AND bc.slug = ${searchParams.category}
      ORDER BY bp.published_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    countResult = await sql`
      SELECT COUNT(DISTINCT bp.id) as total
      FROM blog_posts bp
      INNER JOIN blog_post_categories bpc ON bp.id = bpc.post_id
      INNER JOIN blog_categories bc ON bpc.category_id = bc.id
      WHERE bp.status = 'PUBLISHED' AND bc.slug = ${searchParams.category}
    `
  } else {
    posts = await sql`
      SELECT 
        bp.*,
        u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.status = 'PUBLISHED'
      ORDER BY COALESCE(bp.published_at, bp.created_at) DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    countResult = await sql`
      SELECT COUNT(*) as total
      FROM blog_posts
      WHERE status = 'PUBLISHED'
    `
  }

  const total = parseInt(countResult[0]?.total || "0")
  const totalPages = Math.ceil(total / limit)

  const categories = await sql`
    SELECT 
      bc.*,
      COUNT(bpc.post_id) as post_count
    FROM blog_categories bc
    LEFT JOIN blog_post_categories bpc ON bc.id = bpc.category_id
    INNER JOIN blog_posts bp ON bpc.post_id = bp.id AND bp.status = 'PUBLISHED'
    GROUP BY bc.id
    ORDER BY bc.name
  `

  // Get hub posts (main topic pages)
  const hubPosts = await sql`
    SELECT 
      bp.*,
      u.name as author_name
    FROM blog_posts bp
    LEFT JOIN users u ON bp.author_id = u.id
    WHERE bp.status = 'PUBLISHED' AND bp.is_hub_post = true
    ORDER BY bp.published_at DESC
    LIMIT 6
  `

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-4">Blog</h1>
      <p className="text-lg text-[#BDBDBD] mb-8">
        Fashion tips, style guides, and insights
      </p>

      {/* Hub Posts Section (Hub-and-Spoke Model) */}
      {hubPosts.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-primary"></div>
            <h2 className="text-3xl font-serif font-bold">Topic Hubs</h2>
          </div>
          <p className="text-[#BDBDBD] mb-6 ml-4">
            Explore our comprehensive guides and topic collections
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hubPosts.map((hub: any) => (
              <Link
                key={hub.id}
                href={`/blog/${hub.slug}`}
                className="group bg-gradient-to-br from-[#121213] to-[#0B0B0C] rounded-lg overflow-hidden border-2 border-[#1A1A1B] hover:border-primary transition-all hover:shadow-xl"
              >
                {hub.featured_image && (
                  <div className="aspect-video relative overflow-hidden bg-[#0B0B0C]">
                    <Image
                      src={hub.featured_image}
                      alt={hub.title}
                      fill
                      sizes="33vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-primary/90 text-primary-foreground rounded-full text-xs font-semibold">
                        Hub Post
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  {hub.hub_topic && (
                    <span className="text-xs text-primary mb-2 block font-semibold">
                      {hub.hub_topic}
                    </span>
                  )}
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {hub.title}
                  </h3>
                  {hub.excerpt && (
                    <p className="text-sm text-[#BDBDBD] mb-4 line-clamp-2">
                      {hub.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-[#BDBDBD]">
                    <span>{hub.author_name || "Zarge"}</span>
                    {hub.published_at && (
                      <span>{format(new Date(hub.published_at), "MMM d, yyyy")}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          <Link
            href="/blog"
            className={`px-4 py-2 rounded ${
              !searchParams.category
                ? "bg-primary text-primary-foreground"
                : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
            }`}
          >
            All
          </Link>
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className={`px-4 py-2 rounded ${
                searchParams.category === cat.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-[#121213] text-[#BDBDBD] hover:text-[#F7F7F7]"
              }`}
            >
              {cat.name} ({cat.post_count || 0})
            </Link>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <p className="text-center text-[#BDBDBD] py-16">No blog posts found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-[#121213] rounded-lg overflow-hidden border border-[#1A1A1B] hover:border-primary transition-colors"
              >
                {post.featured_image && (
                  <div className="aspect-video relative overflow-hidden bg-[#0B0B0C]">
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      sizes="33vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="p-6">
                  {post.is_hub_post && (
                    <span className="text-xs text-primary mb-2 block">Hub Post</span>
                  )}
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-[#BDBDBD] mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-[#BDBDBD]">
                    <span>{post.author_name || "Zarge"}</span>
                    {post.published_at && (
                      <span>{format(new Date(post.published_at), "MMM d, yyyy")}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}${searchParams.category ? `&category=${searchParams.category}` : ""}`}
                  className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
                >
                  Previous
                </Link>
              )}
              <span className="px-4 py-2 text-[#BDBDBD]">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}${searchParams.category ? `&category=${searchParams.category}` : ""}`}
                  className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

