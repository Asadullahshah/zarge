"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function HeroSection() {
  const [hasSale, setHasSale] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSale() {
      try {
        const response = await fetch('/api/sale/check')
        const data = await response.json()
        setHasSale(data.hasSale || false)
      } catch (error) {
        console.error('Error checking for sales:', error)
      } finally {
        setLoading(false)
      }
    }
    checkSale()
  }, [])

  return (
    <section className="relative bg-gradient-to-b from-[#0B0B0C] to-[#121213] py-12 md:py-24 px-4">
      <div className="container mx-auto text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6">
          <Image
            src="/img/ICON WHT LOGO TRANSPARANT.png"
            alt="House of Noire"
            width={80}
            height={80}
            className="object-contain"
            priority
          />
          <h1 className="text-4xl md:text-7xl font-brand">
            <span className="font-brand-bold">HOUSE</span>{" "}
            <span className="font-brand-outline">NOIRE</span>
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-[#BDBDBD] mb-6 md:mb-8 max-w-2xl mx-auto px-4">
          Premium Luxury Fashion & Home Essentials
        </p>
        <p className="text-base md:text-lg text-[#BDBDBD] mb-6 md:mb-8 max-w-xl mx-auto px-4">
          Premium formal wear, semi-formal apparel, and curated home textiles
        </p>
        
        {/* Conditional SALE Button */}
        {!loading && hasSale && (
          <div className="mb-8">
            <Link href="/sale">
              <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                SALE
              </Button>
            </Link>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
          <Link href="/men" className="w-full md:w-auto">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full md:w-auto">
              Shop Men&apos;s Collection
            </Button>
          </Link>
          <Link href="/women" className="w-full md:w-auto">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full md:w-auto">
              Shop Women&apos;s Collection
            </Button>
          </Link>
          <Link href="/home-essentials" className="w-full md:w-auto">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full md:w-auto">
              Home Essentials
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}


