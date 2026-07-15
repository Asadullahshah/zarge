"use client"

import { useEffect } from "react"
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

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [enabled])

  return <>{children}</>
}
