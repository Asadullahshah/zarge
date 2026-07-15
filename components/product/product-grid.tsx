"use client"

import ProductCardV2 from "./product-cardV2"
import { getGridLayoutClass } from "./grid-layout-selectorV2"

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
    color_swatches?: Record<string, string>
    stock?: number
  }>
  columns?: number
}

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  return (
    <div className={getGridLayoutClass(columns)}>
      {products.map((product) => (
        <ProductCardV2
          key={product.id}
          image={product.images?.find(img => img.isPrimary)?.url ?? product.images?.[0]?.url ?? ""}
          name={product.name}
          fit="Relaxed Fit"
          category="Zargé"
          price={product.price}
          salePrice={product.salePrice}
          colors={product.available_colors ?? []}
          colorSwatches={product.color_swatches}
          slug={product.slug}
        />
      ))}
    </div>
  )
}