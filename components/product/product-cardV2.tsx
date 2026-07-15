"use client"

import React from 'react'
import Image from "next/image"
import Link from "next/link"
import { getColorHex } from "@/lib/color-utils"

type ProductCardV2Props = {
  image: string
  name: string
  fit: string
  category: string
  price: number
  salePrice?: number
  colors?: string[]
  colorSwatches?: Record<string, string>
  slug: string
}

export default function ProductCardV2({
  image,
  name,
  fit,
  category,
  price,
  salePrice,
  colors = [],
  colorSwatches,
  slug,
}: ProductCardV2Props) {
  const hasSale = salePrice != null && salePrice > 0 && salePrice < price

  return (
    <Link href={`/product/${slug}`} className="flex flex-col cursor-pointer group w-full">

      {/* Product Image — 1:1 to match the product detail page */}
      <div className="aspect-square overflow-hidden bg-[#f0f0ed] w-full">
        <Image
          src={image}
          width={500}
          height={500}
          alt={name}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Text Block */}
      <div className="mt-2.5 space-y-0.5">

        {/* Product Name */}
        <p className="text-[11px] uppercase font-bold tracking-widest text-gray-900 leading-tight">
          {name}
        </p>

        {/* Fit | Category */}
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
          {fit} | {category}
        </p>

        {/* Price */}
        {hasSale ? (
          <p className="pt-0.5 flex items-center gap-2">
            <span className="text-[11px] text-gray-400 line-through">
              PKR {price.toLocaleString()}
            </span>
            <span className="text-[12px] font-bold text-red-600">
              PKR {salePrice!.toLocaleString()}
            </span>
          </p>
        ) : (
          <p className="text-[12px] font-bold text-gray-900 pt-0.5">
            PKR {price.toLocaleString()}
          </p>
        )}

        {/* Color Swatches */}
        {colors.length > 0 && (
          <div className="flex gap-1 pt-1">
            {colors.map((color, index) => (
              <span
                key={index}
                style={{ backgroundColor: getColorHex(color, colorSwatches) }}
                title={color}
                className="w-3 h-3 inline-block border border-gray-300"
              />
            ))}
          </div>
        )}

      </div>
    </Link>
  )
}