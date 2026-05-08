
interface BlogPostSchemaProps {
  post: any
}

export function BlogPostSchema({ post }: BlogPostSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    image: post.featured_image || undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      "@type": "Person",
      name: post.author_name || "Zarge",
    },
    publisher: {
      "@type": "Organization",
      name: "Zarge",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/blog/${post.slug}`,
    },
    ...(post.is_hub_post && {
      about: {
        "@type": "Thing",
        name: post.hub_topic || post.title,
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

