"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CartButton } from "./cart-button"
import { useState, useEffect } from "react"
import { CategoryDropdown } from "./category-dropdown"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hasSale, setHasSale] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Check if any products are on sale
  useEffect(() => {
    async function checkSale() {
      try {
        const response = await fetch('/api/sale/check')
        const data = await response.json()
        setHasSale(data.hasSale || false)
      } catch (error) {
        console.error('Error checking for sales:', error)
      }
    }
    checkSale()
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 bg-[#0B0B0C] border-b border-[#1A1A1B]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-16">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/img/Zarge-removebg-preview.png"
              alt="Zargé Logo"
              width={140}
              height={40}
              className="object-contain mt-4"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {/* {hasSale && (
              <Link 
                href="/sale" 
                className="text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                SALE
              </Link>
            )} */}
            <CategoryDropdown label="Collections" slug="men" />
            <Link href="/about" className="text-[#BDBDBD] hover:text-[#F7F7F7] transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-[#BDBDBD] hover:text-[#F7F7F7] transition-colors">
              Contact
            </Link>
          </nav>

          <div className="relative flex items-center gap-2">

            {/* Inline search box — expands when searchOpen is true */}
            <div className={`absolute right-20 top-1/2 -translate-y-1/2 transition-all duration-300 overflow-hidden ${searchOpen ? "w-48 md:w-72 opacity-100" : "w-0 opacity-0"}`}
>
              <input
                autoFocus={searchOpen}
                type="text"
                placeholder="Search products..."
                className="w-full bg-[#1A1A1B] text-[#F7F7F7] placeholder-[#BDBDBD] text-sm px-3 py-1.5 outline-none rounded-sm"
              />
            </div>

            {/* Magnifying glass / close toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-[#BDBDBD] hover:text-[#F7F7F7]"
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>

            <CartButton />

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1A1A1B] fixed inset-x-0 top-[64px] bottom-0 bg-[#0B0B0C] z-40 overflow-y-auto">
            <div className="py-4 px-4">
              <nav className="flex flex-col gap-4">
                {hasSale && (
                  <Link
                    href="/sale"
                    className="text-primary font-semibold hover:text-primary/80 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    SALE
                  </Link>
                )}
                <CategoryDropdown label="Men" slug="men" mobile />
                <Link href="/about" className="text-[#BDBDBD] hover:text-[#F7F7F7]" onClick={() => setMobileMenuOpen(false)}>
                  About
                </Link>
                <Link href="/contact" className="text-[#BDBDBD] hover:text-[#F7F7F7]" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}