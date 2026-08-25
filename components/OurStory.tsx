"use client"

import Image from "next/image"
import { useState } from "react"

export function OurStory() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section data-theme="light" id="our-story" className="pt-16 pb-0 text-center">
      
      {/* Text content — light background */}
      <div className="max-w-2xl mx-auto space-y-6 px-8 md:px-16">
        <h2 className="font-serif text-4xl font-bold mb-4 text-black">
          Our Story
        </h2>
        <p className="font-sans text-base leading-8 font-light text-black">
          Zarg&eacute; was never meant to be just clothing.
        </p>
        <p className="font-sans text-base leading-8 font-light text-black">
          It started with a feeling—one that&apos;s hard to translate, but impossible to ignore. A quiet strength. A softness that carries weight.
          In Pashto, Zarg&eacute; reflects something close to the heart—something emotional, personal, and deeply human. That meaning sits at the core of everything we create.
        </p>
        <p className="font-sans text-base leading-8 font-light text-black">
          For six months, we worked behind the scenes in Lahore, obsessing over every detail—fabric, texture, thread, and form. Not just to make T-shirts, but to build pieces that feel like something.
          Something you don&apos;t just wear, but connect with.
        </p>
        <p className="font-sans text-base leading-8 font-light text-black">
          Each design tells a story without saying too much.
        </p>
      </div>

      {/* Image container with modal inside */}
      <div data-theme="dark" className="relative w-full h-[80vh] mt-12 overflow-hidden">
        <Image
          src="/img/OurStory.png"
          alt="Our Story"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Read More button */}
        {!modalOpen && (
          <div className="relative top-5">
            <button
              onClick={() => setModalOpen(true)}
              className="font-sans border border-white text-white px-6 py-3 text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
            >
              Read More
            </button>
          </div>
        )}

        {/* Slide-up panel over the image */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-black/75 backdrop-blur-sm transition-all duration-500 ease-in-out ${
            modalOpen ? "h-[100%]" : "h-0"
          } overflow-hidden`}
        >
          <div className="p-8 h-full overflow-y-auto" data-lenis-prevent>
            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-6 text-[#666] hover:text-white transition-colors text-xs tracking-widest uppercase font-sans"
            >
              Close ✕
            </button>

            <div className="space-y-4 text-white text-left text-sm leading-8 font-light mt-6 max-w-lg mx-auto font-sans">
              <p>A bloom that happens in silence.</p>
              <p>A symbol of resilience wrapped in stillness.</p>
              <p>A reminder to believe, even when no one&apos;s watching.</p>
              <p>We chose embroidery because it lasts. It doesn&apos;t fade like prints. It becomes part of the fabric—just like experiences become part of us. Every stitch carries intention. Every thread holds meaning.</p>
              <p>Our oversized silhouettes, crafted from premium French Cotton Terry, are designed to give you space—physically and mentally. Space to move. Space to feel. Space to be.</p>
              <p>Zarg&eacute; is for those who don&apos;t need to be loud to be seen.</p>
              <p>For those who understand that growth is often invisible.</p>
              <p>For those who carry stories within them.</p>
              <p>This is not fast fashion.</p>
              <p>This is not just design.</p>
              <p className="font-serif italic text-lg">
                This is Zarg&eacute;<br />where emotion meets form,<br />and stories are worn, not told.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}