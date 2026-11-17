"use client"

import Image from "next/image"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

// useLayoutEffect runs before paint (no flicker) but warns on the server
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

type StoryParagraph = { italic: boolean; lines: string[] }

// Blank line = new paragraph. A paragraph starting with ">" is serif italic,
// and each of its lines is shown on its own line.
function parseOurStory(text: string): StoryParagraph[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const italic = block.startsWith(">")
      const lines = block
        .split("\n")
        .map((line) => (italic ? line.replace(/^>\s?/, "") : line).trim())
        .filter(Boolean)
      return { italic, lines }
    })
}

function StoryParagraphs({ paragraphs, className }: { paragraphs: StoryParagraph[]; className: string }) {
  return (
    <>
      {paragraphs.map((p, i) =>
        p.italic ? (
          <p key={i} className="font-serif italic text-lg">
            {p.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        ) : (
          <p key={i} className={className}>
            {p.lines.join(" ")}
          </p>
        )
      )}
    </>
  )
}

export function OurStory({ text }: { text: string }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  // Height that fits only whole paragraphs (null = show everything)
  const [cutHeight, setCutHeight] = useState<number | null>(null)
  // How many paragraphs are shown in the grey area; the panel continues from here
  const [visibleCount, setVisibleCount] = useState<number | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const paragraphs = parseOurStory(text)

  // Count how many whole paragraphs fit in the box. If some don't fit, cut
  // the box right after the last one that does (never mid-paragraph) and
  // show the gradient + Read More.
  useIsomorphicLayoutEffect(() => {
    const box = boxRef.current
    const list = listRef.current
    if (!box || !list) return
    const check = () => {
      const maxHeight = parseFloat(getComputedStyle(box).maxHeight)
      const items = Array.from(list.children) as HTMLElement[]
      let lastBottom = 0
      let fitCount = 0
      for (const item of items) {
        const bottom = item.offsetTop + item.offsetHeight
        if (bottom > maxHeight) break
        lastBottom = bottom
        fitCount++
      }
      // Always show at least the first paragraph in full
      if (fitCount === 0 && items[0]) {
        lastBottom = items[0].offsetTop + items[0].offsetHeight
        fitCount = 1
      }
      const overflow = fitCount < items.length
      setOverflowing(overflow)
      setCutHeight(overflow ? lastBottom : null)
      setVisibleCount(fitCount)
    }
    check()
    const observer = new ResizeObserver(check)
    observer.observe(list)
    return () => observer.disconnect()
  }, [text])

  return (
    <section data-theme="light" id="our-story" className="pt-16 pb-0 text-center">

      {/* Text content — light background */}
      <div className="max-w-2xl mx-auto px-8 md:px-16">
        <h2 className="font-serif text-4xl font-bold mb-6 text-black">
          Our Story
        </h2>
        {/* Fixed-height box: only whole paragraphs that fit are shown */}
        <div
          ref={boxRef}
          className="relative max-h-[26rem] overflow-hidden"
          style={cutHeight !== null ? { height: cutHeight } : undefined}
        >
          <div ref={listRef} className="space-y-6 text-black">
            <StoryParagraphs
              paragraphs={paragraphs}
              className="font-sans text-base leading-8 font-light text-black"
            />
          </div>
        </div>
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

        {/* Dark gradient overlay behind Read More (only when text overflows) */}
        {overflowing && !modalOpen && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
        )}

        {/* Read More button */}
        {overflowing && !modalOpen && (
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
              {/* Only the paragraphs that didn't fit in the grey area */}
              <StoryParagraphs paragraphs={paragraphs.slice(visibleCount ?? 0)} className="" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
