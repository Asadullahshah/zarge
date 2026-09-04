"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Lenis from "lenis"

/**
 * Premium inertia-based smooth scrolling (Lenis) for the storefront.
 * Native scrolling is kept on touch devices and when `enabled` is false (e.g. admin).
 */
export function SmoothScroll({
  enabled = true,
  children,
}: {
  enabled?: boolean
  children: React.ReactNode
}) {
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis({
      duration: 1.15,
      // easeOutExpo — slow, weighted settle that reads as "premium"
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    })
    lenisRef.current = lenis

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [enabled])

  useEffect(() => {
    // Lenis tracks its own virtual scroll position, which survives client-side
    // navigation since the layout (and this provider) never unmounts between
    // pages. Without this, new pages can open mid-scroll instead of at the top.
    window.scrollTo(0, 0)
    lenisRef.current?.scrollTo(0, { immediate: true })
  }, [pathname])

  return <>{children}</>
}
