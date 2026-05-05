"use client"

import { useState, useEffect } from "react"

interface ShareButtonsProps {
  title: string
  excerpt?: string
  url: string
}

export function ShareButtons({ title, excerpt, url }: ShareButtonsProps) {
  const [currentUrl, setCurrentUrl] = useState(url)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [])

  const shareData = {
    title,
    text: excerpt || title,
    url: currentUrl,
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(currentUrl)
        alert('Link copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const encodedTitle = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(currentUrl)

  return (
    <div className="flex gap-3">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-[#121213] rounded-lg border border-[#1A1A1B] hover:border-primary hover:text-primary transition-all flex items-center gap-2"
      >
        <span>🐦</span>
        <span className="text-sm">Twitter</span>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-[#121213] rounded-lg border border-[#1A1A1B] hover:border-primary hover:text-primary transition-all flex items-center gap-2"
      >
        <span>📘</span>
        <span className="text-sm">Facebook</span>
      </a>
      <button
        onClick={handleShare}
        className="px-4 py-2 bg-[#121213] rounded-lg border border-[#1A1A1B] hover:border-primary hover:text-primary transition-all flex items-center gap-2"
      >
        <span>🔗</span>
        <span className="text-sm">Share</span>
      </button>
    </div>
  )
}

