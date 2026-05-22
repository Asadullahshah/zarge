"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

interface CategoryDropdownProps {
  label: string
  slug: string
  mobile?: boolean
  isDark?: boolean
}

export function CategoryDropdown({ label, slug, mobile, isDark = false }: CategoryDropdownProps) {
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchSubcategories() {
      try {
        const response = await fetch(`/api/categories/${slug}/subcategories`)
        if (response.ok) {
          const data = await response.json()
          setSubcategories(data.subcategories || [])
        }
      } catch (error) {
        console.error("Error fetching subcategories:", error)
      }
    }
    fetchSubcategories()
  }, [slug])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150)
  }

  if (mobile) {
    return (
      <div>
        <Link
          href={`/category/${slug}`}
          className="text-[#BDBDBD] hover:text-[#F7F7F7] font-medium"
        >
          {label}
        </Link>
        {subcategories.length > 0 && (
          <div className="ml-4 mt-2 space-y-2">
            {subcategories.map((subcat) => (
              <Link
                key={subcat.id}
                href={`/category/${subcat.slug}`}
                className="block text-sm text-[#BDBDBD] hover:text-[#F7F7F7]"
              >
                {subcat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger — color based on isDark */}
      <Link
        href={`/category/${slug}`}
        className={`flex items-center gap-1 transition-colors duration-300 ${
          isDark
            ? "text-[#F5F5F0] hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
            : "text-black hover:text-black/60"
        }`}
      >
        {label}
        {subcategories.length > 0 && (
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </Link>

      {/* Dropdown panel — always light */}
      {isOpen && subcategories.length > 0 && (
        <div
          style={{ backgroundColor: "#ffffff" }}
          className="absolute top-full left-0 w-52 rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 mt-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Link
            href={`/category/${slug}`}
            className="block px-5 py-3 text-sm font-bold text-black hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            All {label}
          </Link>

          <div className="max-h-48 overflow-y-auto">
            {subcategories.map((subcat, index) => (
              <Link
                key={subcat.id}
                href={`/category/${subcat.slug}`}
                className={`block px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
                  index < subcategories.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {subcat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}