"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { slugify } from "@/lib/utils"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  featuredImage: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  isHubPost: z.boolean().optional(),
  hubTopic: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  relatedPostIds: z.array(z.string()).optional(),
})

type BlogFormData = z.infer<typeof blogSchema>

interface BlogPostFormProps {
  post?: any
  categories: Array<{ id: string; name: string; slug: string }>
  hubPosts: Array<{ id: string; title: string; slug: string }>
}

export function BlogPostForm({ post, categories, hubPosts }: BlogPostFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    post?.categories?.map((c: any) => c.id) || []
  )
  const [selectedRelated, setSelectedRelated] = useState<string[]>(
    post?.related_posts || []
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: post
      ? {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featuredImage: post.featured_image,
          status: post.status,
          isHubPost: post.is_hub_post,
          hubTopic: post.hub_topic,
          seoTitle: post.seo_title,
          seoDesc: post.seo_desc,
          seoKeywords: post.seo_keywords?.join(", "),
          canonicalUrl: post.canonical_url,
        }
      : {
          status: "DRAFT",
          isHubPost: false,
        },
  })

  const isHubPost = watch("isHubPost")

  const onSubmit = async (data: BlogFormData) => {
    setLoading(true)
    setError("")

    try {
      const productSlug = data.slug || slugify(data.title)

      const payload = {
        ...data,
        slug: productSlug,
        seoKeywords: data.seoKeywords
          ? data.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean)
          : [],
        categoryIds: selectedCategories,
        relatedPostIds: selectedRelated,
        publishedAt: data.status === "PUBLISHED" ? new Date().toISOString() : null,
      }

      const url = post ? `/api/admin/blog/${post.id}` : "/api/admin/blog"
      const method = post ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save post")
      }

      router.push("/admin/blog")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="slug">Slug (auto-generated if empty)</Label>
          <Input id="slug" {...register("slug")} />
        </div>

        <div>
          <Label htmlFor="excerpt">Excerpt</Label>
          <textarea
            id="excerpt"
            {...register("excerpt")}
            rows={3}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </div>

        <div>
          <Label htmlFor="content">Content *</Label>
          <RichTextEditor
            content={watch("content") || ""}
            onChange={(html) => setValue("content", html)}
            placeholder="Start writing your blog post..."
          />
          {errors.content && <p className="text-destructive text-sm mt-1">{errors.content.message}</p>}
        </div>

        <div>
          <Label htmlFor="featuredImage">Featured Image URL</Label>
          <Input id="featuredImage" {...register("featuredImage")} />
        </div>

        <div>
          <Label htmlFor="status">Status *</Label>
          <select
            id="status"
            {...register("status")}
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </section>

      {/* Hub & Spoke Model */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">Hub & Spoke Model</h2>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register("isHubPost")}
            className="rounded border-input"
          />
          <span>This is a Hub Post (main topic)</span>
        </label>

        {isHubPost && (
          <div>
            <Label htmlFor="hubTopic">Hub Topic</Label>
            <Input
              id="hubTopic"
              {...register("hubTopic")}
              placeholder="e.g., Men's Formal Wear Guide"
            />
            <p className="text-xs text-[#BDBDBD] mt-1">
              The main topic this hub post covers
            </p>
          </div>
        )}

        {!isHubPost && hubPosts.length > 0 && (
          <div>
            <Label>Related Hub Posts</Label>
            <div className="space-y-2 mt-2">
              {hubPosts.map((hub) => (
                <label key={hub.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedRelated.includes(hub.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRelated([...selectedRelated, hub.id])
                      } else {
                        setSelectedRelated(selectedRelated.filter((id) => id !== hub.id))
                      }
                    }}
                    className="rounded border-input"
                  />
                  <span>{hub.title}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-[#BDBDBD] mt-2">
              Link this spoke post to relevant hub posts for better SEO
            </p>
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-[#121213] p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold mb-4">Blog Categories</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategories([...selectedCategories, category.id])
                    } else {
                      setSelectedCategories(selectedCategories.filter((id) => id !== category.id))
                    }
                  }}
                  className="rounded border-input"
                />
                <span>{category.name}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {/* SEO */}
      <section className="bg-[#121213] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-4">SEO & AEO Settings</h2>
        
        <div>
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input id="seoTitle" {...register("seoTitle")} />
        </div>

        <div>
          <Label htmlFor="seoDesc">SEO Description</Label>
          <textarea
            id="seoDesc"
            {...register("seoDesc")}
            rows={3}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
          />
        </div>

        <div>
          <Label htmlFor="seoKeywords">SEO Keywords (comma-separated)</Label>
          <Input id="seoKeywords" {...register("seoKeywords")} />
        </div>

        <div>
          <Label htmlFor="canonicalUrl">Canonical URL</Label>
          <Input id="canonicalUrl" {...register("canonicalUrl")} />
        </div>

        <div className="bg-[#0B0B0C] p-4 rounded border border-[#1A1A1B]">
          <h4 className="font-semibold mb-2">AEO Optimization Tips:</h4>
          <ul className="text-sm text-[#BDBDBD] space-y-1 list-disc list-inside">
            <li>Use natural language in content</li>
            <li>Answer questions directly and concisely</li>
            <li>Link related hub and spoke posts together</li>
            <li>Include structured data in content</li>
            <li>Use keywords naturally throughout</li>
          </ul>
        </div>
      </section>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : post ? "Update Post" : "Create Post"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

