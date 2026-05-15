"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CartButton } from "./cart-button"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { CategoryDropdown } from "./category-dropdown"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchSubcategories() {
      try {
        const res = await fetch("/api/categories/men/subcategories")
        if (res.ok) {
          const data = await res.json()
          setSubcategories(data.subcategories || [])
        }
      } catch (err) {
        console.error("Failed to fetch subcategories", err)
      }
    }
    fetchSubcategories()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY < 10) {
        setVisible(true)
      } else if (currentScrollY < lastScrollY) {
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
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [mobileMenuOpen])

  return (
    <>
      <header className={`sticky top-0 z-[60] transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}>
        <div className="container mx-auto px-4">
          <div className="relative flex h-16 items-center justify-between">

            {/* LOGO */}
            <Link href="/" className="shrink-0 transition-opacity hover:opacity-90">
              <Image
                src="/img/Zarge-removebg-preview.png"
                alt="Zargé Logo"
                width={168}
                height={48}
                className="mt-4 h-auto w-[140px] object-contain brightness-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] sm:w-[152px] md:w-[160px]"
                priority
              />
            </Link>

            {/* NAV LINKS — desktop */}
            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
              <CategoryDropdown label="Collections" slug="men" />
              <Link href="/#our-story" className="text-[#F5F5F0] transition-colors hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                Brand
              </Link>
              <Link href="/contact" className="text-[#F5F5F0] transition-colors hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                Contact
              </Link>
            </nav>

            {/* RIGHT SIDE ACTIONS */}
            <div className="flex items-center gap-2 relative z-[61]">
              <div className="[&_button]:text-[#F5F5F0] [&_button]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] [&_button]:hover:bg-white/10 [&_button]:hover:text-white">
                <CartButton />
              </div>
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
        </div>
      </header>

      {/* MOBILE MENU */}
      {mounted && mobileMenuOpen && createPortal(
        <div
          className="fixed inset-0 z-[70] overflow-y-auto md:hidden"
          style={{
            backgroundColor: "rgba(245, 242, 238, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Close button */}
          <div className="flex justify-end px-4 pt-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: "#1a1a1a" }}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex flex-col justify-center min-h-[80vh] px-10 py-6">
            <nav className="flex flex-col gap-8">

              {/* COLLECTIONS with dropdown */}
              <div className="flex flex-col gap-4">
                <button
                  className="flex items-center gap-2 text-2xl uppercase tracking-widest font-light text-left"
                  style={{ color: "#1a1a1a" }}
                  onClick={() => setCollectionsOpen(!collectionsOpen)}
                >
                  Collections
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${collectionsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {collectionsOpen && (
                  <div className="flex flex-col gap-3 pl-4 border-l-2" style={{ borderColor: "#d4d4d4" }}>
                    <Link
                      href="/category/men"
                      className="text-lg uppercase tracking-widest font-medium"
                      style={{ color: "#1a1a1a" }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      All Collections
                    </Link>
                    {subcategories.map((subcat) => (
                      <Link
                        key={subcat.id}
                        href={`/category/${subcat.slug}`}
                        className="text-base uppercase tracking-widest font-light"
                        style={{ color: "#555555" }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subcat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/#our-story"
                className="text-2xl uppercase tracking-widest font-light"
                style={{ color: "#1a1a1a" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Brand
              </Link>

              <Link
                href="/contact"
                className="text-2xl uppercase tracking-widest font-light"
                style={{ color: "#1a1a1a" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>

            </nav>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}