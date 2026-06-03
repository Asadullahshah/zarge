"use client"

import { useState, useEffect } from "react"
import  ProductCardV2  from "./product-cardV2"
import { GridLayoutSelector, getGridLayoutClass } from "./grid-layout-selector"

interface ProductGridProps {
  products: Array<{
    id: string
    name: string
    slug: string
    price: number
    salePrice?: number
    images?: Array<{ url: string; isPrimary?: boolean; color?: string }>
    shortDesc?: string
    available_colors?: string[]
    stock?: number
  }>
}

export function ProductGrid({ products }: ProductGridProps) {
  const [columns, setColumns] = useState(4)

  useEffect(() => {
    // Load saved preference from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem('productGridLayout')
      if (savedLayout) {
        const cols = parseInt(savedLayout, 10)
        if ([2, 3, 4, 5].includes(cols)) {
          setColumns(cols)
        }
      }
    }
  }, [])

  const handleLayoutChange = (newColumns: number) => {
    setColumns(newColumns)
    if (typeof window !== 'undefined') {
      localStorage.setItem('productGridLayout', newColumns.toString())
    }
  }


  return (
    <>
      <div className="flex justify-start md:justify-end mb-4 overflow-x-auto pb-2">
        <GridLayoutSelector onLayoutChange={handleLayoutChange} />
      </div>
      <div className={getGridLayoutClass(columns)}>
        {products.map((product) => (
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
    </>
  )
}

