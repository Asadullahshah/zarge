"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

interface CategoryDropdownProps {
  label: string
  slug: string
  mobile?: boolean
}

export function CategoryDropdown({ label, slug, mobile }: CategoryDropdownProps) {
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

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
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
    // Add a small delay before closing to allow moving mouse to dropdown
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150)
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
      <Link
        href={`/category/${slug}`}
        className="flex items-center gap-1 text-[#F5F5F0] transition-colors hover:text-white"
      >
        {label}
        {subcategories.length > 0 && (
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </Link>

      {isOpen && subcategories.length > 0 && (
        <div 
          className="absolute top-full left-0 w-64 bg-[#121213] border border-[#1A1A1B] rounded-lg shadow-xl py-2 z-50 mt-1"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Link
            href={`/category/${slug}`}
            className="block px-4 py-2 hover:bg-[#1A1A1B] font-semibold text-[#F7F7F7] transition-colors"
          >
            All {label}
          </Link>
          {subcategories.map((subcat) => (
            <Link
              key={subcat.id}
              href={`/category/${subcat.slug}`}
              className="block px-4 py-2 hover:bg-[#1A1A1B] transition-colors text-[#BDBDBD] hover:text-[#F7F7F7]"
            >
              {subcat.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

