"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

type HeroBackgroundVideoProps = {
  src: string
  poster: string
  className?: string
}

export function HeroBackgroundVideo({ src, poster, className = "" }: HeroBackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || failed) return

    const tryPlay = () => {
      video.play().catch(() => {
        // Autoplay can be blocked until interaction; poster stays visible.
      })
    }

    tryPlay()

    const onCanPlay = () => {
      setReady(true)
      tryPlay()
    }

    video.addEventListener("canplay", onCanPlay)
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [src, failed])

  return (
    <div className={`absolute inset-0 ${className}`}>
      <Image
        src={poster}
        alt=""
        fill
        sizes="100vw"
        className={`object-cover transition-opacity duration-500 ${
          ready && !failed ? "opacity-0" : "opacity-100"
        }`}
        priority
      />
      {!failed && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          onPlaying={() => setReady(true)}
          onError={() => setFailed(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  )
}
