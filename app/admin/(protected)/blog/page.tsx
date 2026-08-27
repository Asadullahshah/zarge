import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { format } from "date-fns"

export default async function BlogPage() {
  await requireAuth()

  const posts = await sql`
    SELECT 
      bp.*,
      u.name as author_name
    FROM blog_posts bp
    LEFT JOIN users u ON bp.author_id = u.id
    ORDER BY bp.created_at DESC
    LIMIT 50
  `

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold">Blog Posts</h1>
        <Link href="/admin/blog/new">
          <Button className="w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      <div className="bg-[#121213] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-[#1A1A1B]">
            <tr>
              <th className="text-left p-4">Title</th>
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Author</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Published</th>
              <th className="text-left p-4">Views</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#BDBDBD]">
                  No blog posts yet. Create your first post!
                </td>
              </tr>
            ) : (
              posts.map((post: any) => (
                <tr key={post.id} className="border-t border-[#1A1A1B]">
                  <td className="p-4">
                    <div>
                      <div className="font-semibold">{post.title}</div>
                      {post.is_hub_post && (
                        <span className="text-xs text-primary">Hub Post</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {post.is_hub_post ? (
                      <span className="text-primary">Hub</span>
                    ) : (
                      <span className="text-[#BDBDBD]">Spoke</span>
                    )}
                  </td>
                  <td className="p-4">{post.author_name || "Unknown"}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        post.status === "PUBLISHED"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[#BDBDBD]">
                    {post.published_at
                      ? format(new Date(post.published_at), "MMM d, yyyy")
                      : "-"}
                  </td>
                  <td className="p-4">{post.view_count || 0}</td>
                  <td className="p-4">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

