"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function ScrollToHash() {
  const pathname = usePathname()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    // Instantly jump to top before browser auto-scrolls to hash
    window.history.replaceState(null, "", window.location.pathname)
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })

    // Small delay to let the page render first
    const timer = setTimeout(() => {
      if (typeof document === "undefined") return
      try {
        // Guard against invalid CSS selectors (e.g. "#123") which throw
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      } catch {
        /* invalid hash selector — ignore */
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}