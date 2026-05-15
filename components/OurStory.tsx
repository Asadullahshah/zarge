"use client"

import Image from "next/image"
import { useState } from "react"

export function OurStory() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section className="py-16 text-center">
      <div className="max-w-2xl mx-auto space-y-6 px-8 md:px-16">
        <p className="text-4xl font-serif font-bold mb-4">Our Story</p>
        <p className="text-[#BDBDBD]">Zarg&eacute; was never meant to be just clothing.</p>
        <p className="text-[#BDBDBD]">
          It started with a feeling—one that&apos;s hard to translate, but impossible to ignore. A quiet strength. A softness that carries weight.
          In Pashto, Zarg&eacute; reflects something close to the heart—something emotional, personal, and deeply human. That meaning sits at the core of everything we create.
        </p>
        <p className="text-[#BDBDBD]">
          For six months, we worked behind the scenes in Lahore, obsessing over every detail—fabric, texture, thread, and form. Not just to make T-shirts, but to build pieces that feel like something.
          Something you don&apos;t just wear, but connect with.
        </p>
        <p className="text-[#BDBDBD]">Each design tells a story without saying too much.</p>
      </div>

      {/* Image container with modal inside */}
      <div className="relative w-full h-[80vh] mt-12 overflow-hidden">
        <Image
          src="/img/OurStory.jpeg"
          alt="Our Story"
          fill
          className="object-cover object-center"
        />

        {/* Read More button */}
        {!modalOpen && (
          <div className="absolute bottom-8 left-8">
            <button
              onClick={() => setModalOpen(true)}
              className="border border-white text-white px-6 py-3 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
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
          <div className="p-8 h-full overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-6 text-[#666] hover:text-white transition-colors text-xs tracking-widest uppercase"
            >
              Close ✕
            </button>

            <div className="space-y-4 text-white text-left text-sm leading-7 mt-6 max-w-lg mx-auto">
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
              <p>This is Zarg&eacute;—<br />where emotion meets form,<br />and stories are worn, not told.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}