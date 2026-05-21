"use client"

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"

const TAGLINE = "Wearable narratives stitched through embroidery"

const BTN_PRIMARY =
  "inline-flex items-center justify-center border border-black text-black px-6 py-3 text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300"
const BTN_SECONDARY =
  "inline-flex items-center justify-center border border-[#B8960C] text-[#B8960C] px-6 py-3 text-sm tracking-widest uppercase hover:bg-[#B8960C] hover:text-white transition-all duration-300"

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
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
      {slides.map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`font-light transition-all duration-300 leading-none ${
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
        onClick={onPrev}
      >
        <ArrowLeftIcon />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-transparent border border-black text-black hover:bg-black/10 hover:text-black"
        onClick={onNext}
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

  const imageClass = `object-cover transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`

  return (
    <>
      {/* ── VIDEO SECTION ── */}
      <section className="relative h-screen w-full overflow-hidden -mt-16">
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

      {/* ── HERO SECTION ── */}
      {/* No -mt-16 here so it sits cleanly below the video */}
      <section className="relative overflow-hidden h-screen">

        {/* ── DESKTOP LAYOUT (1280px+) ── */}
        <div className="hidden xl:flex h-full min-h-0 flex-row items-stretch">
          <div className="flex w-[45%] h-full flex-col items-start justify-center px-3 xl:pl-60 overflow-hidden min-h-0 shrink-0 basis-[45%]">
            <p className="text-2xl xl:text-5xl uppercase tracking-widest font-bold text-black max-w-2xl">
              {TAGLINE}
            </p>
            <div className="mt-10 xl:mt-12 flex flex-wrap gap-2 xl:gap-4">
              <Link href="/products" className={BTN_PRIMARY}>Shop This Piece</Link>
              <Link href="/products" className={BTN_SECONDARY}>View Collection</Link>
            </div>
          </div>

          <div className="relative w-[55%] h-full">
            <div className="absolute inset-0">
              <Image
                src={slides[currentSlide].image}
                alt="Product image"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`${imageClass} object-[center_30%]`}
                priority
              />
              <SlideNumbers current={currentSlide} onSelect={setCurrentSlide} />
              <NavArrows onPrev={goToPrev} onNext={goToNext} className="absolute bottom-6 right-6" />
            </div>
          </div>
        </div>

        {/* ── MOBILE + TABLET LAYOUT (up to 1279px) ── */}
        <div className="xl:hidden relative w-full h-full z-10">

          <div
            className="absolute inset-0 cursor-pointer z-0"
            onClick={() => setModalOpen(true)}
          >
            <Image
              src={slides[currentSlide].image}
              alt="Product image"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`${imageClass} object-top`}
              priority
            />
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-4 py-2 rounded-full">
              Tap to view details
            </div>
          </div>

          <SlideNumbers current={currentSlide} onSelect={setCurrentSlide} />
          <NavArrows
            onPrev={goToPrev}
            onNext={goToNext}
            className="absolute bottom-8 md:bottom-12 right-4 md:right-8 z-10"
          />

          {/* ── MODAL (mobile + tablet) ── */}
          {modalOpen && (
            <div
              className="absolute inset-0 z-10 flex flex-col overflow-y-auto"
              style={{
                backgroundColor: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute bottom-10 left-8 text-black text-sm uppercase tracking-widest flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
              >
                ✕ Close
              </button>

              <div className="flex flex-col justify-center px-8 md:px-16 min-h-full max-w-2xl md:mx-auto w-full">
                <p className="text-2xl md:text-4xl uppercase tracking-widest font-bold text-black max-w-sm md:max-w-lg">
                  {TAGLINE}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4">
                  <Link href="/products" className={BTN_PRIMARY} onClick={() => setModalOpen(false)}>
                    Shop This Piece
                  </Link>
                  <Link href="/products" className={BTN_SECONDARY} onClick={() => setModalOpen(false)}>
                    View Collection
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

      </section>
    </>
  )
}