"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import GridLayoutSelectorV2, { getGridLayoutClass } from "./grid-layout-selectorV2"
import { FilterDrawer } from "../category/filter-drawer"
import ProductCardV2 from "./product-cardV2"
import { ChevronDown } from "lucide-react"

const PER_PAGE_OPTIONS = [10, 20, 30, 40]

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number
  images?: Array<{ url: string; isPrimary?: boolean }>
  available_colors?: string[]
}

interface ProductToolbarProps {
  products: Product[]
}

function sortProducts(products: Product[], sort: string): Product[] {
  const sorted = [...products]
  switch (sort) {
    case "price-low":
      return sorted.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))
    case "price-high":
      return sorted.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price))
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name))
    default:
      return sorted
  }
}

export function ProductToolbar({ products = [] }: ProductToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [columns, setColumns] = useState(4)
  const [sort, setSort] = useState("featured")
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isLocked = products.length <= 10

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort])

  const totalPages = Math.ceil(sortedProducts.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + perPage)

  const handleSortChange = (value: string) => {
    setSort(value)
    setCurrentPage(1)
  }

  const handlePerPageChange = (value: number) => {
    setPerPage(value)
    setCurrentPage(1)
    setDropdownOpen(false)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">

        {/* Showing X of Z products */}
        <div className="flex items-center gap-1.5 text-lg text-[#000000]">
          <span>Showing</span>

          {isLocked ? (
            <span className="text-black font-medium">{products.length}</span>
          ) : (
            <div className="relative" ref={dropdownRef}>
              {/* Trigger */}
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E0E0E0] rounded-md text-sm font-medium text-black hover:border-black transition-colors"
              >
                {perPage}
                <ChevronDown
                  size={13}
                  className={`text-[#BDBDBD] transition-transform duration-150 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Panel */}
              {dropdownOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 z-50 bg-white border border-[#E0E0E0] rounded-md overflow-hidden shadow-sm min-w-full">
                  {PER_PAGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => handlePerPageChange(option)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        perPage === option
                          ? "text-black font-medium bg-[#F7F7F7]"
                          : "text-[#BDBDBD] hover:text-black hover:bg-[#F7F7F7]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <span>of {products.length} products</span>
        </div>

        <GridLayoutSelectorV2
          columns={columns}
          onLayoutChange={setColumns}
          onFilterClick={() => setFilterOpen(true)}
        />
      </div>

      <div className={getGridLayoutClass(columns)}>
        {paginatedProducts.map((product) => (
          <ProductCardV2
            key={product.id}
            image={product.images?.find(img => img.isPrimary)?.url ?? product.images?.[0]?.url ?? ""}
            name={product.name}
            fit="Relaxed Fit"
            category="Men"
            price={product.salePrice ?? product.price}
            colors={product.available_colors ?? []}
            slug={product.slug}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 mt-12 mb-4">
          {currentPage > 1 ? (
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-black transition-colors"
            >
              Previous
            </button>
          ) : (
            <span className="px-3 py-2 text-sm text-gray-300 cursor-not-allowed">Previous</span>
          )}

          {(() => {
            const pages: (number | string)[] = []
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i)
            } else {
              pages.push(1)
              if (currentPage > 3) pages.push("...")
              for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i)
              }
              if (currentPage < totalPages - 2) pages.push("...")
              pages.push(totalPages)
            }
            return pages.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-3 py-2 text-sm text-gray-400">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`px-3 py-2 text-sm transition-colors rounded ${
                    p === currentPage ? "font-semibold text-black" : "text-gray-500 hover:text-black"
                  }`}
                >
                  {p}
                </button>
              )
            )
          })()}

          {currentPage < totalPages ? (
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-black transition-colors"
            >
              Next
            </button>
          ) : (
            <span className="px-3 py-2 text-sm text-gray-300 cursor-not-allowed">Next</span>
          )}
        </div>
      )}

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        sort={sort}
        onSortChange={handleSortChange}
      />
    </>
  )
}