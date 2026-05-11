"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"

const slides = [
  {
    image: "/img/bloom.png",
    tagline: "Wearable narratives stitched through embroidery",
    story: `Zargé means beloved.
But becoming something meaningful doesn't happen all at once.
It unfolds.
This design captures a truth we lived.
A flower bends.
Then it begins to rise.
And finally, it stands-fully bloomed.
Not instantly.
Not perfectly.
But step by step.`,
  },
  {
    image: "/img/SilentBloom.png",
    tagline: "Wearable narratives stitched through embroidery",
    story: `Zargé means beloved.
But not everything that is meaningful is witnessed.

Some things grow in silence.

This piece reflects a kind of bloom that doesn't happen in the spotlight—
but in moments of uncertainty, doubt, and isolation.

Branches that feel restrained.
Flowers that still find a way to emerge.`,
  },
  {
    image: "/img/R6.png",
    tagline: "Wearable narratives stitched through embroidery",
    story: `Inspired by Naruto and the journey of Naruto Uzumaki

Zargé means beloved.
But not everyone starts that way.

Some are ignored.
Some are misunderstood.
Some grow up carrying something inside them the world fears.
`,
  },
  {
    image: "/img/Sword.png",
    tagline: "Wearable narratives stitched through embroidery",
    story: `Inspired by Bleach and the essence of Byakuya Kuchiki

Zargé means beloved.
But not in the loud, obvious sense.

It's the kind of love that exists quietly
carried in actions, in restraint, in sacrifice.

This piece draws from the spirit of Byakuya Kuchiki—a man defined not by what he shows, but by what he carries within. Bound by honor, shaped by loss, and guided by a code that often demands silence over expression.
`,
  },
]

export function HeroSectionV2() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (modalOpen) return
    const timer = setInterval(() => {
      goToNext()
    }, 5000)
    return () => clearInterval(timer)
  }, [currentSlide, modalOpen])

  // useEffect(() => {
  //   if (modalOpen) {
  //     document.body.style.overflow = "hidden"
  //   } else {
  //     document.body.style.overflow = ""
  //   }
  //   return () => { document.body.style.overflow = "" }
  // }, [modalOpen])

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

  return (
    <section className="relative overflow-hidden h-[calc(100vh-80px)] md:h-[calc(100vh-60px)] xl:h-[calc(100vh-50px)]">

      {/* ── DESKTOP LAYOUT (1280px+) ── */}
      <div className="hidden xl:flex h-full flex-row items-stretch">

        {/* LEFT SIDE */}
        <div className="flex w-[45%] flex-col justify-center px-3 py-6 text-white xl:py-16 xl:pl-60 xl:-mt-2">
          <p className="text-[8px] xl:text-base uppercase tracking-widest text-gray-500 transition-opacity duration-300 xl:w-[500px">
            {slides[currentSlide].tagline}
          </p>

          <div className="mt-0 xl:mt-6 overflow-hidden flex justify-start">
            <Image
              src="/img/Zarge-removebg-preview.png"
              alt="Zarge logo"
              width={500}
              height={200}
              className="h-auto w-[120px] xl:w-[500px] object-contain brightness-0"
              priority
            />
          </div>

          <p
            className={`mt-2 whitespace-pre-line text-[10px] xl:text-sm font-light leading-relaxed text-gray-700 xl:max-w-xl transition-opacity duration-300 ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
          >
            {slides[currentSlide].story}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 xl:gap-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-black border border-black px-3 py-2 xl:px-6 xl:py-3 text-[10px] xl:text-sm text-white transition-colors hover:bg-zinc-800"
            >
              Shop This Piece
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-[#B8960C] px-3 py-2 xl:px-6 xl:py-3 text-[10px] xl:text-sm text-white transition-opacity hover:opacity-90"
            >
              View Collection
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE - CAROUSEL */}
        <div className="relative w-[55%] h-full">
          <div className="absolute inset-0">
            <Image
              src={slides[currentSlide].image}
              alt="Product image"
              fill
              className={`object-cover object-[center_30%] transition-opacity duration-300 ${
                isAnimating ? "opacity-0" : "opacity-100"
              }`}
              priority
            />

            {/* Vertical slide numbers */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`font-light transition-all duration-300 leading-none ${
                    index === currentSlide
                      ? "text-black text-3xl font-bold"
                      : "text-black/40 text-sm"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              ))}
            </div>

            {/* Prev / Next arrows */}
            <div className="absolute bottom-6 right-6 flex items-center gap-2">
              <button
                onClick={goToPrev}
                className="w-8 h-8 flex items-center justify-center bg-black text-white text-sm hover:bg-zinc-800 transition-colors"
              >
                ←
              </button>
              <button
                onClick={goToNext}
                className="w-8 h-8 flex items-center justify-center bg-black text-white text-sm hover:bg-zinc-800 transition-colors"
              >
                →
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── MOBILE + TABLET LAYOUT (up to 1279px) ── */}
      <div className="xl:hidden relative w-full h-full">

        {/* Full screen image — tappable to open modal */}
        <div
          className="absolute inset-0 cursor-pointer z-0"
          onClick={() => setModalOpen(true)}
        >
          <Image
            src={slides[currentSlide].image}
            alt="Product image"
            fill
            className={`object-cover object-top transition-opacity duration-300 ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
            priority
          />

          {/* Tap hint */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-4 py-2 rounded-full">
            Tap to view details
          </div>
        </div>

        {/* Vertical slide numbers */}
        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 md:gap-5 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`font-light transition-all duration-300 leading-none ${
                index === currentSlide
                  ? "text-white text-2xl md:text-3xl font-bold"
                  : "text-white/50 text-xs md:text-sm"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </button>
          ))}
        </div>

        {/* Prev / Next arrows */}
        <div className="absolute bottom-8 md:bottom-12 right-4 md:right-8 flex items-center gap-2 z-10">
          <button
            onClick={goToPrev}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-black text-white text-sm hover:bg-zinc-800 transition-colors"
          >
            ←
          </button>
          <button
            onClick={goToNext}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-black text-white text-sm hover:bg-zinc-800 transition-colors"
          >
            →
          </button>
        </div>

        {/* ── MODAL (mobile + tablet) ── */}
        {modalOpen && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col overflow-y-auto">

            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-white text-2xl z-10 w-9 h-9 flex items-center justify-center bg-white/10 rounded-full"
            >
              ✕
            </button>

            <div className="flex flex-col justify-center px-8 md:px-16 py-16 md:py-24 min-h-full max-w-2xl md:mx-auto w-full">

              {/* Tagline */}
              <p className="text-xs md:text-sm uppercase tracking-widest text-gray-400">
                {slides[currentSlide].tagline}
              </p>

              {/* Logo */}
              <div className="mt-6 flex justify-start">
                <Image
                  src="/img/Zarge-removebg-preview.png"
                  alt="Zarge logo"
                  width={300}
                  height={120}
                  className="h-auto w-[220px] md:w-[320px] object-contain brightness-0 invert"
                  priority
                />
              </div>

              {/* Story */}
              <p
                className={`mt-4 whitespace-pre-line text-sm md:text-base font-light leading-relaxed text-gray-300 transition-opacity duration-300 ${
                  isAnimating ? "opacity-0" : "opacity-100"
                }`}
              >
                {slides[currentSlide].story}
              </p>

              {/* Buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center bg-white border border-white px-6 py-3 md:px-8 md:py-4 text-sm md:text-base text-black transition-colors hover:bg-gray-200"
                  onClick={() => setModalOpen(false)}
                >
                  Shop This Piece
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center bg-[#B8960C] px-6 py-3 md:px-8 md:py-4 text-sm md:text-base text-white transition-opacity hover:opacity-90"
                  onClick={() => setModalOpen(false)}
                >
                  View Collection
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>

    </section>
  )
}