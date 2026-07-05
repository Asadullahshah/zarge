"use client"

import { ProductCard } from "@/components/product/product-card"
import Link from "next/link"

interface SearchResultsProps {
  products: any[]
  query: string
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function SearchResults({ products, query, pagination }: SearchResultsProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[#BDBDBD] text-lg mb-4">No products found for &quot;{query}&quot;</p>
        <p className="text-sm text-[#BDBDBD] mb-6">
          Try different keywords or browse our categories
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/men"
            className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
          >
            Men&apos;s Collection
          </Link>
          <Link
            href="/women"
            className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
          >
            Women&apos;s Collection
          </Link>
          <Link
            href="/home-essentials"
            className="px-4 py-2 bg-[#121213] rounded border border-[#1A1A1B] hover:border-primary transition-colors"
          >
            Home Essentials
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {products.map((product: any) => {
          const productData = {
            ...product,
            images: product.images || [],
            price: parseFloat(product.price),
            salePrice: product.sale_price ? parseFloat(product.sale_price) : undefined,
          }
          return <ProductCard key={product.id} product={productData} />
        })}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 items-center">
          {pagination.page > 1 && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${pagination.page - 1}`}
              className="px-4 py-2 rounded border border-[#1A1A1B] text-black"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-[#BDBDBD]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          {pagination.page < pagination.totalPages && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${pagination.page + 1}`}
              className="px-4 py-2 rounded border border-[#1A1A1B] text-black"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </>
  )
}

