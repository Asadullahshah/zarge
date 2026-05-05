"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export function SitemapRegenerator() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<any>(null)

  const handleRegenerate = async () => {
    setLoading(true)
    setError("")
    setSuccess(null)

    try {
      const response = await fetch("/api/admin/sitemap/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to regenerate sitemap")
      }

      setSuccess(data)
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 5000)
    } catch (err: any) {
      setError(err.message || "An error occurred while regenerating the sitemap")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#121213] p-6 rounded-lg border border-[#1A1A1B]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-serif font-bold mb-2">Sitemap Management</h2>
          <p className="text-sm text-[#BDBDBD]">
            Update and verify your sitemap. The sitemap uses a multi-sitemap structure with category-specific sitemaps (Men, Women, Home Essentials, Blog, Static pages) for better organization and faster indexing.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-md">
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{success.message}</p>
              {success.stats && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <div className="text-[#BDBDBD]">Static Pages</div>
                    <div className="text-lg font-bold">{success.stats.staticPages}</div>
                  </div>
                  <div>
                    <div className="text-[#BDBDBD]">Products</div>
                    <div className="text-lg font-bold">{success.stats.products}</div>
                  </div>
                  <div>
                    <div className="text-[#BDBDBD]">Categories</div>
                    <div className="text-lg font-bold">{success.stats.categories}</div>
                  </div>
                  <div>
                    <div className="text-[#BDBDBD]">Blog Posts</div>
                    <div className="text-lg font-bold">{success.stats.blogPosts}</div>
                  </div>
                  <div>
                    <div className="text-[#BDBDBD]">Total URLs</div>
                    <div className="text-lg font-bold text-primary">{success.stats.totalUrls}</div>
                  </div>
                </div>
              )}
              {success.note && (
                <p className="text-xs text-[#BDBDBD] mt-2">{success.note}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          onClick={handleRegenerate}
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating Sitemap...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Sitemap
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => window.open('/sitemap.xml', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Sitemap
        </Button>
      </div>
    </div>
  )
}

