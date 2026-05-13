"use client"

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"

const TAGLINE = "Wearable narratives stitched through embroidery"

const BTN_PRIMARY = "inline-flex items-center justify-center border border-black text-black px-6 py-3 text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300"
const BTN_SECONDARY = "inline-flex items-center justify-center border border-[#B8960C] text-[#B8960C] px-6 py-3 text-sm tracking-widest uppercase hover:bg-[#B8960C] hover:text-white transition-all duration-300"
const BTN_PRIMARY_DARK = "inline-flex items-center justify-center border border-white text-white px-6 py-3 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
const BTN_SECONDARY_DARK = "inline-flex items-center justify-center border border-[#B8960C] text-[#B8960C] px-6 py-3 text-sm tracking-widest uppercase hover:bg-[#B8960C] hover:text-white transition-all duration-300"

const slides = [
  { image: "/img/bloom.png" },
  { image: "/img/SilentBloom.png" },
  { image: "/img/R6.png" },
  { image: "/img/Sword.png" },
]

function SlideNumbers({
  current,
  onSelect,
  light = false,
}: {
  current: number
  onSelect: (i: number) => void
  light?: boolean
}) {
  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
      {slides.map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`font-light transition-all duration-300 leading-none ${
            index === current
              ? `${light ? "text-white" : "text-black"} text-3xl font-bold`
              : `${light ? "text-white/50" : "text-black/40"} text-sm`
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
      <Button variant="outline" size="icon" className="rounded-full bg-black border-black text-white hover:bg-zinc-800 hover:text-white" onClick={onPrev}>
        <ArrowLeftIcon />
      </Button>
      <Button variant="outline" size="icon" className="rounded-full bg-black border-black text-white hover:bg-zinc-800 hover:text-white" onClick={onNext}>
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
    <section className="relative overflow-hidden h-screen -mt-16">

      {/* ── DESKTOP LAYOUT (1280px+) ── */}
      <div className="hidden xl:flex h-full min-h-0 flex-row items-stretch">

        {/* LEFT SIDE */}
        <div className="flex w-[45%] h-full flex-col justify-center px-3 xl:pl-60 overflow-hidden min-h-0 shrink-0 basis-[45%]">
          <p className="text-[8px] xl:text-base uppercase tracking-widest text-gray-500 xl:w-[500px]">
            {TAGLINE}
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

          <div className="mt-3 flex flex-wrap gap-2 xl:gap-4">
            <Link href="/products" className={BTN_PRIMARY}>Shop This Piece</Link>
            <Link href="/products" className={BTN_SECONDARY}>View Collection</Link>
          </div>
        </div>

        {/* RIGHT SIDE - CAROUSEL */}
        <div className="relative w-[55%] h-full">
          <div className="absolute inset-0">
            <Image
              src={slides[currentSlide].image}
              alt="Product image"
              fill
              className={`${imageClass} object-[center_30%]`}
              priority
            />
            <SlideNumbers current={currentSlide} onSelect={setCurrentSlide} />
            <NavArrows onPrev={goToPrev} onNext={goToNext} className="absolute bottom-6 right-6" />
          </div>
        </div>
      </div>

      {/* ── MOBILE + TABLET LAYOUT (up to 1279px) ── */}
      <div className="xl:hidden relative w-full h-full">

        <div
          className="absolute inset-0 cursor-pointer z-0"
          onClick={() => setModalOpen(true)}
        >
          <Image
            src={slides[currentSlide].image}
            alt="Product image"
            fill
            className={`${imageClass} object-top`}
            priority
          />
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-4 py-2 rounded-full">
            Tap to view details
          </div>
        </div>

        <SlideNumbers current={currentSlide} onSelect={setCurrentSlide} />
        <NavArrows onPrev={goToPrev} onNext={goToNext} className="absolute bottom-8 md:bottom-12 right-4 md:right-8 z-10" />

        {/* ── MODAL (mobile + tablet) ── */}
        {modalOpen && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-14 right-5 text-white text-2xl z-10 w-9 h-9 flex items-center justify-center bg-white/10 rounded-full"
            >
              ✕
            </button>

            <div className="flex flex-col justify-center items-center px-8 md:px-16 py-16 md:py-24 min-h-full max-w-2xl md:mx-auto w-full">
              <p className="text-xs md:text-sm uppercase tracking-widest text-gray-400">
                {TAGLINE}
              </p>

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

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/products" className={BTN_PRIMARY_DARK} onClick={() => setModalOpen(false)}>
                  Shop This Piece
                </Link>
                <Link href="/products" className={BTN_SECONDARY_DARK} onClick={() => setModalOpen(false)}>
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