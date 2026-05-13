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
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)


  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY < 10) {
        setVisible(true)
      } else {
        setVisible(false)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

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
    <header className={`sticky top-0 z-[60] bg-transparent transition-transform duration-300 ${
      visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="container mx-auto px-4">

        {/* HEADER ROW */}
        <div className="relative flex h-16 items-center justify-between">

          {/* LOGO — high contrast over variable page background */}
          <Link
            href="/"
            className="shrink-0 transition-opacity hover:opacity-90"
          >
            <Image
              src="/img/Zarge-removebg-preview.png"
              alt="Zargé Logo"
              width={168}
              height={48}
              className="mt-4 h-auto w-[140px] object-contain brightness-0 invert drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] sm:w-[152px] md:w-[160px]"
              priority
            />
          </Link>

          {/* NAV LINKS (FIXED CENTER, NEVER MOVES) */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex [&_a]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            <CategoryDropdown label="Collections" slug="men" />
            <Link href="/about" className="text-[#F5F5F0] transition-colors hover:text-white">
              About
            </Link>
            <Link href="/contact" className="text-[#F5F5F0] transition-colors hover:text-white">
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
              className="text-[#F5F5F0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] hover:bg-white/10 hover:text-white"
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {/* CART */}
            <div className="[&_button]:text-[#F5F5F0] [&_button]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] [&_button]:hover:bg-white/10 [&_button]:hover:text-white">
              <CartButton />
            </div>

            {/* MOBILE MENU BUTTON */}
            <Button
              variant="ghost"
              size="icon"
              className="text-[#F5F5F0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] hover:bg-white/10 hover:text-white md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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