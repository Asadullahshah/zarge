"use client"

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { HeroBackgroundVideo } from "@/components/home/hero-background-video"
import { useCart, notifyCartUpdated } from "@/context/cart-context"

const TAGLINE = "Wearable narratives stitched through embroidery"

export type HeroSlide = {
  id?: string
  image: string
  imageMobile?: string
  name: string
  description: string
  slug?: string
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    image: "/img/bloom.png",
    name: "Blooming",
    description: "A flower bends, then begins to rise, then stands fully bloomed. Not instantly. Not perfectly. But step by step. This design captures a truth — that nothing meaningful ever blooms all at once.",
  },
  {
    image: "/img/silentbloom.png",
    name: "Silent Bloom",
    description: "Some things grow in silence. Branches that feel restrained. Flowers that still find a way to emerge. This piece is about becoming without announcement — evolving without applause.",
  },
  {
    image: "/img/r6.png",
    name: "The Fire Within",
    description: "Rooted in the journey of Naruto Uzumaki — someone who began with nothing but rejection, yet refused to become defined by it. The 9 stands for that force within. Not something to hide, but something to grow into.",
  },
  {
    image: "/img/sword.png",
    name: "The Beloved Silence",
    description: "Inspired by Byakuya Kuchiki — a man defined not by what he shows, but by what he carries within. Bound by honor, shaped by loss, guided by a code that demands silence over expression.",
  },

]

function SlideNumbers({
  current,
  onSelect,
  total,
}: {
  current: number
  onSelect: (i: number) => void
  total: number
}) {
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10 border border-grey bg-white/30 px-3 py-4 shadow-lg"
        style={{ borderRadius: "16px" }}
    >
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={(e) => { e.stopPropagation(); onSelect(index) }}
          className={`font-sans font-light transition-all duration-300 leading-none text-black = ${
            index === current
              ? "text-3xl font-bold"
              : "text-sm opacity-80"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </button>
      ))}
    </div>
  )
}

function NavArrows({
  onPrev,
  onNext,
  className = "",
}: {
  onPrev: () => void
  onNext: () => void
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-white/30 border border-grey text-black hover:bg-white/50 hover:text-black"
        onClick={(e) => { e.stopPropagation(); onPrev() }}
      >
        <ArrowLeftIcon />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-white/30 border border-grey text-black hover:bg-white/50 hover:text-black"
        onClick={(e) => { e.stopPropagation(); onNext() }}
      >
        <ArrowRightIcon />
      </Button>
    </div>
  )
}

export function HeroSectionV2({ slides: slidesProp }: { slides?: HeroSlide[] } = {}) {
  const { openCart } = useCart()
  const slides = slidesProp && slidesProp.length > 0 ? slidesProp : DEFAULT_SLIDES
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)")
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (modalOpen) return
    const timer = setInterval(goToNext, 3000)
    return () => clearInterval(timer)
  }, [currentSlide, modalOpen])

  function goToNext() {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
      setIsAnimating(false)
    }, 300)
  }

  function goToPrev() {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
      setIsAnimating(false)
    }, 300)
  }

  const imageClass = `object-cover object-center xl:object-contain transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`

  const activeSlide = slides[currentSlide] ?? slides[0]
  const activeImage = isDesktop ? activeSlide.image : (activeSlide.imageMobile || activeSlide.image)
  const shopHref = activeSlide.slug ? `/product/${activeSlide.slug}` : "/products"

  async function handleAddToCart() {
    // Without a real product id (e.g. fallback slides), send the user to shop
    if (!activeSlide.id) {
      window.location.href = shopHref
      return
    }
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: activeSlide.id,
          quantity: 1,
          variantId: null,
          size: null,
          color: null,
        }),
      })
      if (res.ok) {
        notifyCartUpdated()
        openCart()
      } else {
        // Product likely needs size/color — let the user pick on the detail page
        window.location.href = shopHref
      }
    } catch {
      window.location.href = shopHref
    }
  }

  return (
    <>
      {/* ── VIDEO SECTION — DESKTOP (1280px+) ── */}
      <section data-theme="dark" className="hidden xl:block relative min-h-[100svh] w-full overflow-hidden -mt-16 snap-center">
        <HeroBackgroundVideo
          src="/video/zarge.mp4"
          poster="/video/zarge-poster.jpg"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Scroll down hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white z-10">
          <span className="text-xs uppercase tracking-widest opacity-70">Scroll</span>
          <div className="w-px h-8 bg-white/50 animate-pulse" />
        </div>
      </section>

      {/* ── VIDEO SECTION — MOBILE + TABLET (up to 1279px) ── */}
      <section data-theme="dark" className="xl:hidden relative min-h-[100svh] w-full overflow-hidden -mt-16 snap-center">
        <HeroBackgroundVideo
          src="/video/zarge-mobile.mp4"
          poster="/video/zarge-poster.jpg"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Scroll down hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white z-10">
          <span className="font-sans text-xs uppercase tracking-widest opacity-70">Scroll</span>
          <div className="w-px h-8 bg-white/50 animate-pulse" />
        </div>
      </section>

      {/* ── HERO SECTION ── */}
      <section data-theme="light" className="relative overflow-hidden h-[100svh] snap-center">

        {/* Click-outside backdrop to close the desktop info panel */}
        {panelOpen && (
          <div
            className="absolute inset-0 z-[5] hidden xl:block"
            onClick={() => setPanelOpen(false)}
            aria-hidden
          />
        )}

        {/* ── LEFT INFO PANEL — slides in on image click, desktop only ── */}
        <div className={`hidden xl:flex flex-col justify-center px-16 z-10 bg-white/95 backdrop-blur-sm
          absolute left-0 top-0 h-full w-[420px] transition-transform duration-500 ease-in-out
          ${panelOpen ? "translate-x-0" : "-translate-x-full"}`}>

          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); setPanelOpen(false) }}
            className="absolute top-6 right-6 text-black/40 hover:text-black text-xs tracking-widest uppercase font-sans"
          >
            Close ✕
          </button>

          <p className="font-sans text-xs tracking-widest uppercase text-black/40 mb-3">New Arrival</p>
          <h1 className="font-serif text-5xl font-light leading-tight text-black mb-4">
          {activeSlide.name}
          </h1>
          <p className="font-sans text-sm text-black/60 leading-relaxed max-w-xs mb-8">
          {activeSlide.description}
          </p>
          <div className="flex gap-3">
            <Link href={shopHref}
              className="font-sans inline-flex items-center justify-center bg-black text-white px-4 py-5 text-xs tracking-widest uppercase hover:bg-black/80 transition-all duration-300">
              Learn More
            </Link>
            <button onClick={handleAddToCart} className="font-sans inline-flex items-center justify-center border border-black text-black px-5 py-3 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300">
              Add to Cart
            </button>
          </div>
        </div>

        {/* ── IMAGE — full screen, click opens panel (desktop) or modal (mobile) ── */}
        <div
          className="absolute inset-0 cursor-pointer z-0"
          onClick={() => {
            if (window.innerWidth >= 1280) {
              setPanelOpen(true)
            } else {
              setModalOpen(true)
            }
          }}
        >
          <Image
            src={activeImage}
            alt={activeSlide.name || "Product image"}
            fill
            sizes="(max-width: 768px) 100vw, 100vw"
            className={imageClass}
            priority
          />

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        {/* Slide numbers */}
        <SlideNumbers current={currentSlide} onSelect={setCurrentSlide} total={slides.length} />

        {/* Nav arrows */}
        <NavArrows
          onPrev={goToPrev}
          onNext={goToNext}
          className="absolute bottom-8 right-10 md:right-14 z-10"
        />

        {/* ── MODAL — mobile + tablet only ── */}
        {modalOpen && (
          <div
            className="absolute inset-0 z-20 flex flex-col xl:hidden"
            style={{
              backgroundColor: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors text-xs tracking-widest uppercase font-sans"
            >
              Close ✕
            </button>

            {/* Centered content */}
            <div className="flex flex-col justify-center items-center min-h-full px-8 gap-4 text-center">

              <p className="font-sans text-xs tracking-widest uppercase text-white/40">
                New Arrival
              </p>

              <h2 className="font-serif text-3xl font-light text-white leading-snug">
              {activeSlide.name}
              </h2>

              <p className="font-sans text-sm text-white/60 leading-relaxed max-w-xs">
              {activeSlide.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Link
                  href={shopHref}
                  className="font-sans inline-flex items-center justify-center bg-white text-black px-8 py-3 text-xs tracking-widest uppercase hover:bg-white/80 transition-all duration-300"
                  onClick={() => setModalOpen(false)}
                >
                  Learn More
                </Link>
                <button
                  className="font-sans inline-flex items-center justify-center border border-[#B8960C] text-[#B8960C] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#B8960C] hover:text-white transition-all duration-300"
                  onClick={() => { setModalOpen(false); handleAddToCart() }}
                >
                  Add to Cart
                </button>
              </div>

            </div>
          </div>
        )}

      </section>
    </>
  )
}