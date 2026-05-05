"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CartButton } from "./cart-button"
import { useState, useEffect } from "react"
import { CategoryDropdown } from "./category-dropdown"
import { SearchBarExpanded } from "@/components/search/search-bar-expanded"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hasSale, setHasSale] = useState(false)

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
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/img/ICON WHT LOGO TRANSPARANT.png"
              alt="House of Noire"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <span className="text-2xl font-brand hidden sm:block">
              <span className="font-brand-bold">HOUSE</span>{" "}
              <span className="font-brand-outline">NOIRE</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {hasSale && (
              <Link 
                href="/sale" 
                className="text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                SALE
              </Link>
            )}
            <CategoryDropdown label="Men" slug="men" />
            <CategoryDropdown label="Women" slug="women" />
            <CategoryDropdown label="Home Essentials" slug="home-essentials" />
            <Link href="/about" className="text-[#BDBDBD] hover:text-[#F7F7F7] transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-[#BDBDBD] hover:text-[#F7F7F7] transition-colors">
              Contact
            </Link>
            <Link href="/blog" className="text-[#BDBDBD] hover:text-[#F7F7F7] transition-colors">
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <CartButton />
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

        {/* Search Bar Expanded (appears below menu - hidden when mobile menu is open) */}
        {!mobileMenuOpen && (
          <div className="border-t border-[#1A1A1B] relative">
            <SearchBarExpanded />
          </div>
        )}

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
                <CategoryDropdown label="Women" slug="women" mobile />
                <CategoryDropdown label="Home Essentials" slug="home-essentials" mobile />
                <Link href="/about" className="text-[#BDBDBD] hover:text-[#F7F7F7]" onClick={() => setMobileMenuOpen(false)}>
                  About
                </Link>
                <Link href="/contact" className="text-[#BDBDBD] hover:text-[#F7F7F7]" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
                <Link href="/blog" className="text-[#BDBDBD] hover:text-[#F7F7F7]" onClick={() => setMobileMenuOpen(false)}>
                  Blog
                </Link>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
