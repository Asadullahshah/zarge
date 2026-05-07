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

  useEffect(() => {
    const timer = setInterval(() => {
      goToNext()
    }, 5000)
    return () => clearInterval(timer)
  }, [currentSlide])

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
    <section className="relative min-h-screen overflow-hidden">
      <div className="flex min-h-screen flex-col md:flex-row">

        {/* LEFT SIDE */}
        <div className="flex w-full flex-col justify-center px-8 py-16 text-white md:w-[45%] md:pl-80 md:-mt-12">
          <p className="text-sm uppercase tracking-widest text-gray-500 transition-opacity duration-300">
            {slides[currentSlide].tagline}
          </p>

          <div className="mt-6  overflow-hidden flex justify-center">
            <Image
              src="/img/Zarge-removebg-preview.png"                                     //bg-red-300  
              alt="Zarge logo"
              width={500}
              height={200}
              className="h-auto w-[500px] object-contain brightness-0"
              priority
            />
          </div>

          <p
            className={`mt-0 whitespace-pre-line text-sm font-light leading-relaxed text-gray-700 md:max-w-xl transition-opacity duration-300 ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
          >
            {slides[currentSlide].story}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-black border border-black px-6 py-3 text-sm text-white transition-colors hover:bg-zinc-800"
            >
              Shop This Piece
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-[#B8960C] px-6 py-3 text-sm text-white transition-opacity hover:opacity-90"
            >
              View Collection
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE - CAROUSEL */}
        <div className="relative w-full md:-ml-12 md:w-[55%]">
          <div className="relative h-screen w-full">
            <Image
              src={slides[currentSlide].image}
              alt="Product image"
              fill
              className={`object-cover object-top transition-opacity duration-300 ${
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
            <div className="absolute bottom-6 right-6 flex items-center gap-3">
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
    </section>
  )
}