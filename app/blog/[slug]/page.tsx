import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import Image from "next/image"
import { format } from "date-fns"
import { Metadata } from "next"
import Link from "next/link"
import { BlogPostSchema } from "@/components/seo/blog-schema"
import { ShareButtons } from "@/components/blog/share-buttons"

async function getPost(slug: string) {
  const post = await sql`
    SELECT 
      bp.*,
      u.name as author_name
    FROM blog_posts bp
    LEFT JOIN users u ON bp.author_id = u.id
    WHERE bp.slug = ${slug} AND bp.status = 'PUBLISHED'
  `

  if (post.length === 0) {
    return null
  }

  const [postData] = post

  // Get categories
  const categories = await sql`
    SELECT bc.* FROM blog_categories bc
    INNER JOIN blog_post_categories bpc ON bc.id = bpc.category_id
    WHERE bpc.post_id = ${postData.id}
  `

  // Get related posts if this is a spoke post
  let relatedPosts: any[] = []
  let hubPost: any = null
  
  if (postData.related_posts) {
    // Parse related_posts - it comes from DB as JSON string or array
    let relatedPostsArray: string[] = []
    try {
      // Log the type and value for debugging
      const rawValue = postData.related_posts
      const valueType = typeof rawValue
      
      if (valueType === 'string') {
        const trimmed = rawValue.trim()
        // Check if it's double-encoded (starts and ends with quotes)
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          // Double-encoded: parse twice
          const firstParse = JSON.parse(trimmed)
          relatedPostsArray = typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse
        } else {
          // Single JSON string
          relatedPostsArray = JSON.parse(trimmed)
        }
      } else if (Array.isArray(rawValue)) {
        relatedPostsArray = rawValue
      } else {
        console.warn('Unexpected related_posts type:', valueType, rawValue)
        relatedPostsArray = []
      }
    } catch (e) {
      console.error('Error parsing related_posts:', e, 'Type:', typeof postData.related_posts, 'Value:', postData.related_posts)
      relatedPostsArray = []
    }

    if (relatedPostsArray.length > 0) {
      // This is a spoke post - get the hub post it's related to
      // Use IN clause instead of ANY to avoid array literal issues
      if (relatedPostsArray.length === 1) {
        const hub = await sql`
          SELECT id, title, slug, excerpt, featured_image, hub_topic
          FROM blog_posts
          WHERE id = ${relatedPostsArray[0]}
          AND status = 'PUBLISHED' AND is_hub_post = true
          LIMIT 1
        `
        if (hub.length > 0) {
          hubPost = hub[0]
        }
      } else {
        // For multiple IDs, build IN clause manually
        // Query each ID separately and find the hub post
        for (const id of relatedPostsArray) {
          const hub = await sql`
            SELECT id, title, slug, excerpt, featured_image, hub_topic
            FROM blog_posts
            WHERE id = ${id}
            AND status = 'PUBLISHED' AND is_hub_post = true
            LIMIT 1
          `
          if (hub.length > 0) {
            hubPost = hub[0]
            break // Found the hub post, stop searching
          }
        }
      }
      
      // Get other spoke posts in the same hub
      const hubId = hubPost ? hubPost.id : relatedPostsArray[0]
      relatedPosts = await sql`
        SELECT id, title, slug, excerpt, featured_image
        FROM blog_posts
        WHERE related_posts @> ARRAY[${hubId}]::UUID[]
        AND status = 'PUBLISHED' AND id != ${postData.id}
        ORDER BY published_at DESC
        LIMIT 6
      `
    }
  }

  // Get other posts in same hub if this is a hub post
  if (postData.is_hub_post) {
    const hubPosts = await sql`
      SELECT id, title, slug, excerpt, featured_image
      FROM blog_posts
      WHERE related_posts @> ARRAY[${postData.id}]::UUID[]
      AND status = 'PUBLISHED'
      ORDER BY published_at DESC
      LIMIT 6
    `
    relatedPosts = hubPosts as any[]
  }

  return {
    ...postData,
    categories: categories as any[],
    relatedPosts,
    hubPost,
  } as any
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {}
  }

  return {
    title: post.seo_title || `${post.title} | Zarge Blog`,
    description: post.seo_desc || post.excerpt || post.content.substring(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160),
      images: post.featured_image ? [post.featured_image] : [],
      type: "article",
      publishedTime: post.published_at,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  // Increment view count
  await sql`
    UPDATE blog_posts
    SET view_count = view_count + 1
    WHERE id = ${post.id}
  `

  // Calculate reading time (average 200 words per minute)
  const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200)

  return (
    <>
      <BlogPostSchema post={post} />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#0B0B0C] via-[#121213] to-[#1A1A1B] border-b border-[#1A1A1B]">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="text-sm text-[#BDBDBD] mb-6 flex items-center gap-2">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-[#F7F7F7]">{post.title}</span>
            </nav>

            {/* Categories & Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {post.categories && post.categories.length > 0 && (
                <>
                  {post.categories.map((cat: any) => (
                    <Link
                      key={cat.id}
                      href={`/blog?category=${cat.slug}`}
                      className="px-4 py-1.5 bg-[#121213] rounded-full text-sm border border-[#1A1A1B] hover:border-primary hover:text-primary transition-all"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </>
              )}
              {post.is_hub_post && (
                <span className="px-4 py-1.5 bg-primary/20 text-primary rounded-full text-sm font-semibold border border-primary/30">
                  🎯 Hub Post
                </span>
              )}
              {post.hub_topic && (
                <span className="px-4 py-1.5 bg-[#121213] rounded-full text-sm border border-[#1A1A1B] text-[#BDBDBD]">
                  {post.hub_topic}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl md:text-2xl text-[#BDBDBD] mb-8 leading-relaxed max-w-3xl">
                {post.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-[#BDBDBD] mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-xs font-semibold">
                    {(post.author_name || "HO")[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{post.author_name || "Zarge"}</span>
              </div>
              {post.published_at && (
                <>
                  <span className="text-[#1A1A1B]">•</span>
                  <time dateTime={post.published_at} className="flex items-center gap-1">
                    <span>📅</span>
                    {format(new Date(post.published_at), "MMMM d, yyyy")}
                  </time>
                </>
              )}
              <span className="text-[#1A1A1B]">•</span>
              <span className="flex items-center gap-1">
                <span>👁️</span>
                {post.view_count || 0} views
              </span>
              <span className="text-[#1A1A1B]">•</span>
              <span className="flex items-center gap-1">
                <span>⏱️</span>
                {readingTime} min read
              </span>
            </div>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="relative rounded-xl overflow-hidden mb-8 bg-[#121213] border border-[#1A1A1B] shadow-2xl">
                <div className="aspect-video relative">
                  <Image
                    src={post.featured_image}
                    alt={post.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Content with Enhanced Styling */}
          <div
            className="blog-content prose prose-invert prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Social Share Section */}
          <div className="my-12 py-8 border-y border-[#1A1A1B]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Share this article</h3>
                <p className="text-sm text-[#BDBDBD]">Help others discover this content</p>
              </div>
              <ShareButtons 
                title={post.title}
                excerpt={post.excerpt || undefined}
                url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.noirefit.com'}/blog/${post.slug}`}
              />
            </div>
          </div>

          {/* Hub & Spoke Navigation */}
          {post.hubPost && !post.is_hub_post && (
            <div className="my-12 py-8 border-y border-[#1A1A1B]">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-8 border border-primary/20 shadow-lg">
                <div className="flex items-start gap-2 mb-4">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-sm text-primary font-semibold mb-1">Part of the Topic Hub</p>
                    <p className="text-xs text-[#BDBDBD]">Explore the complete guide</p>
                  </div>
                </div>
                <Link
                  href={`/blog/${post.hubPost.slug}`}
                  className="group flex items-center gap-4 p-4 bg-[#121213]/50 rounded-lg border border-primary/20 hover:border-primary/40 transition-all"
                >
                  {post.hubPost.featured_image && (
                    <div className="w-24 h-24 relative rounded-lg overflow-hidden bg-[#0B0B0C] flex-shrink-0 border border-[#1A1A1B]">
                      <Image
                        src={post.hubPost.featured_image}
                        alt={post.hubPost.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    {post.hubPost.hub_topic && (
                      <span className="text-xs text-primary font-semibold mb-2 block">
                        {post.hubPost.hub_topic}
                      </span>
                    )}
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {post.hubPost.title}
                    </h3>
                    {post.hubPost.excerpt && (
                      <p className="text-sm text-[#BDBDBD] mb-3 line-clamp-2">
                        {post.hubPost.excerpt}
                      </p>
                    )}
                    <span className="text-sm text-primary font-medium group-hover:underline inline-flex items-center gap-1">
                      Read Full Guide <span>→</span>
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="my-12 py-10 px-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-serif font-bold mb-3">Explore Our Collections</h3>
              <p className="text-[#BDBDBD] mb-6">
                Discover premium fashion and home essentials that match the style insights from this article.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/collections/unspoken-resilience"
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Shop Unspoken Resilience
                </Link>
                <Link
                  href="/collections/still-becoming"
                  className="px-6 py-3 bg-[#121213] border border-[#1A1A1B] rounded-lg font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  Shop Still Becoming
                </Link>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <div className="my-12 pt-8 border-t border-[#1A1A1B]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-10 bg-primary"></div>
                <div>
                  <h2 className="text-3xl font-serif font-bold">
                    {post.is_hub_post 
                      ? `Explore More in "${post.hub_topic || 'This Hub'}"` 
                      : "Related Articles"}
                  </h2>
                  <p className="text-sm text-[#BDBDBD] mt-1">
                    {post.is_hub_post 
                      ? "Discover related topics and guides" 
                      : "Continue reading related content"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {post.relatedPosts.map((related: any) => (
                  <Link
                    key={related.id}
                    href={`/blog/${related.slug}`}
                    className="group bg-gradient-to-br from-[#121213] to-[#0B0B0C] rounded-xl overflow-hidden border border-[#1A1A1B] hover:border-primary transition-all hover:shadow-xl"
                  >
                    {related.featured_image && (
                      <div className="aspect-video relative overflow-hidden bg-[#0B0B0C]">
                        <Image
                          src={related.featured_image}
                          alt={related.title}
                          fill
                          sizes="33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="text-sm text-[#BDBDBD] line-clamp-3 mb-4">
                          {related.excerpt}
                        </p>
                      )}
                      <span className="text-sm text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read More <span>→</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to Blog */}
          <div className="mt-12 pt-8 border-t border-[#1A1A1B]">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[#BDBDBD] hover:text-primary transition-colors group"
            >
              <span>←</span>
              <span>Back to Blog</span>
            </Link>
          </div>
        </div>
      </article>
    </>
  )
}

