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
  const [searchOpen, setSearchOpen] = useState(false)
  const [hasSale, setHasSale] = useState(false)

  useEffect(() => {
    async function checkSale() {
      try {
        const res = await fetch("/api/sale/check")
        const data = await res.json()
        setHasSale(data.hasSale || false)
      } catch (err) {
        console.error("Sale check failed", err)
      }
    }
    checkSale()
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [mobileMenuOpen])

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev)
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0B0B0C] border-b border-[#1A1A1B]">
      <div className="container mx-auto px-4">

        {/* HEADER ROW */}
        <div className="flex items-center justify-between h-16 relative">

          {/* LOGO */}
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

          {/* NAV LINKS (FIXED CENTER, NEVER MOVES) */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <CategoryDropdown label="Collections" slug="men" />
            <Link href="/about" className="text-[#BDBDBD] hover:text-[#F7F7F7]">
              About
            </Link>
            <Link href="/contact" className="text-[#BDBDBD] hover:text-[#F7F7F7]">
              Contact
            </Link>
          </nav>

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex items-center gap-2 relative">

            {/* DESKTOP SEARCH (OVERLAY ONLY - NO LAYOUT SHIFT) */}
            <div
              className={`
                hidden md:block absolute right-32 top-1/2 -translate-y-1/2
                transition-all duration-300 overflow-hidden
                ${searchOpen ? "w-[clamp(90px,14vw,180px)] opacity-100" : "w-0 opacity-0"}
              `}
            >
              <input
                autoFocus={searchOpen}
                type="text"
                placeholder="Search products..."
                className="w-full bg-[#1A1A1B] text-[#F7F7F7] placeholder-[#BDBDBD] text-sm px-3 py-1.5 outline-none rounded-sm"
              />
            </div>

            {/* SEARCH BUTTON */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSearch}
              className="text-[#BDBDBD] hover:text-[#F7F7F7]"
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>

            {/* CART */}
            <CartButton />

            {/* MOBILE MENU BUTTON */}
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

        {/* MOBILE SEARCH (ONLY ONE INSTANCE) */}
        {searchOpen && (
          <div className="md:hidden w-full pb-3">
            <input
              autoFocus
              type="text"
              placeholder="Search products..."
              className="w-full bg-[#1A1A1B] text-[#F7F7F7] placeholder-[#BDBDBD] text-sm px-3 py-2 outline-none rounded-sm"
            />
          </div>
        )}
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1A1A1B] fixed inset-x-0 top-[64px] bottom-0 bg-[#0B0B0C] z-40 overflow-y-auto">
          <div className="py-4 px-4">
            <nav className="flex flex-col gap-4">

              {hasSale && (
                <Link
                  href="/sale"
                  className="text-primary font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  SALE
                </Link>
              )}

              <CategoryDropdown label="Men" slug="men" mobile />

              <Link href="/about" className="text-[#BDBDBD]" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>

              <Link href="/contact" className="text-[#BDBDBD]" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>

            </nav>
          </div>
        </div>
      )}
    </header>
  )
}