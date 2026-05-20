"use client"

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"

const TAGLINE = "Wearable narratives stitched through embroidery"

const slides = [
  { image: "/img/bloom.png" },
  { image: "/img/SilentBloom.png" },
  { image: "/img/R6.png" },
  { image: "/img/Sword.png" },
]

function SlideNumbers({
  current,
  onSelect,
}: {
  current: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
      {slides.map((_, index) => (
        <button
          key={index}
          onClick={(e) => { e.stopPropagation(); onSelect(index) }}
          className={`font-sans font-light transition-all duration-300 leading-none ${
            index === current
              ? "text-black text-3xl font-bold"
              : "text-black/40 text-sm"
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
        className="rounded-full bg-transparent border border-black text-black hover:bg-black/10 hover:text-black"
        onClick={(e) => { e.stopPropagation(); onPrev() }}
      >
        <ArrowLeftIcon />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-transparent border border-black text-black hover:bg-black/10 hover:text-black"
        onClick={(e) => { e.stopPropagation(); onNext() }}
      >
        <ArrowRightIcon />
      </Button>
    </div>
  )
}

export function HeroSectionV2() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (modalOpen) return
    const timer = setInterval(goToNext, 5000)
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

  const imageClass = `object-cover object-center transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`

  return (
    <>
      {/* ── VIDEO SECTION — DESKTOP (1280px+) ── */}
      <section data-theme="dark" className="hidden xl:block relative min-h-[100svh] w-full overflow-hidden -mt-16">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video/zarge.MP4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Scroll down hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white z-10">
          <span className="text-xs uppercase tracking-widest opacity-70">Scroll</span>
          <div className="w-px h-8 bg-white/50 animate-pulse" />
        </div>
      </section>

      {/* ── VIDEO SECTION — MOBILE + TABLET (up to 1279px) ── */}
      <section data-theme="dark" className="xl:hidden relative min-h-[100svh] w-full overflow-hidden -mt-16">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-contain object-center"
        >
          <source src="/video/zarge.MP4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Scroll down hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white z-10">
          <span className="font-sans text-xs uppercase tracking-widest opacity-70">Scroll</span>
          <div className="w-px h-8 bg-white/50 animate-pulse" />
        </div>
      </section>

      {/* ── VIDEO SECTION — MOBILE + TABLET (up to 1279px) ── */}
      <section data-theme="dark" className="xl:hidden relative min-h-[100svh] w-full overflow-hidden -mt-16">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src="/video/zarge.MP4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        {/* <div className="absolute inset-0 bg-black/30" /> */}

        {/* Scroll down hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white z-10">
          <span className="font-sans text-xs uppercase tracking-widest opacity-70">Scroll</span>
          <div className="w-px h-8 bg-white/50 animate-pulse" />
        </div>
      </section>

      {/* ── HERO SECTION — all devices, click to open modal ── */}
      {/* No -mt-16 here so it sits cleanly below the video */}
      <section data-theme="light" className="relative overflow-hidden h-screen">

        {/* ── FULL SCREEN CLICKABLE IMAGE — all devices ── */}
        <div
          className="absolute inset-0 cursor-pointer z-0"
          onClick={() => setModalOpen(true)}
        >
          <Image
            src={slides[currentSlide].image}
            alt="Product image"
            fill
            className={`${imageClass} xl:object-contain`}
            priority
          />

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Tap/Click hint — different text per device */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-4 py-2 rounded-full z-10 whitespace-nowrap font-sans tracking-widest uppercase">
            <span className="xl:hidden">Tap to view details</span>
            <span className="hidden xl:inline">Click to view details</span>
          </div>
        </div>

        {/* Slide numbers */}
        <SlideNumbers current={currentSlide} onSelect={setCurrentSlide} />

        {/* Nav arrows */}
        <NavArrows
          onPrev={goToPrev}
          onNext={goToNext}
          className="absolute bottom-8 right-10 md:right-14 z-10"
        />

        {/* ── MODAL — same on ALL devices (mobile, tablet, desktop) ── */}
        {modalOpen && (
          <div
            className="absolute inset-0 z-20 flex flex-col"
            style={{
              backgroundColor: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            {/* Close button — top right */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors text-xs tracking-widest uppercase font-sans"
            >
              Close ✕
            </button>

            {/* Centered content */}
            <div className="flex flex-col justify-center items-center min-h-full px-8 gap-6">

              {/* Tagline */}
              <p className="font-serif italic text-white/70 text-lg md:text-xl text-center max-w-sm">
                {TAGLINE}
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="font-sans inline-flex items-center justify-center border border-white text-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
                  onClick={() => setModalOpen(false)}
                >
                  Shop This Piece
                </Link>
                <Link
                  href="/products"
                  className="font-sans inline-flex items-center justify-center border border-[#B8960C] text-[#B8960C] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#B8960C] hover:text-white transition-all duration-300"
                  onClick={() => setModalOpen(false)}
                >
                  View Collection
                </Link>
              </div>
            </div>
          </div>
        )}

      </section>
    </>
  )
}