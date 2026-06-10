"use client"

import { useState, useMemo } from "react"
import GridLayoutSelectorV2, { getGridLayoutClass } from "./grid-layout-selectorV2"
import { FilterDrawer } from "../category/filter-drawer"
import ProductCardV2 from "./product-cardV2"

const PRODUCTS_PER_PAGE = 10

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
  // ADDED: current page state, starts at 1
  const [currentPage, setCurrentPage] = useState(1)

  // Sort the full products array in memory
  const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort])

  // Pagination math
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE)
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  // ADDED: slice the sorted array to only show current page's products
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE)

  // When sort changes, reset to page 1 so user isn't stuck on page 3 of new sort
  const handleSortChange = (value: string) => {
    setSort(value)
    setCurrentPage(1)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-[#BDBDBD]">
          Showing {startIndex + 1}–{Math.min(startIndex + PRODUCTS_PER_PAGE, sortedProducts.length)} of {sortedProducts.length} products
        </p>
        <GridLayoutSelectorV2
          columns={columns}
          onLayoutChange={setColumns}
          onFilterClick={() => setFilterOpen(true)}
        />
      </div>

      {/* Only render the current page's slice */}
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

      {/* ADDED: client-side pagination UI */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 mt-12 mb-4">
          {/* Previous */}
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

          {/* Page numbers */}
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

          {/* Next */}
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