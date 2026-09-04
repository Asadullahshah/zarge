export type ProductType = 
  | 'STITCHED' 
  | 'UNSTITCHED' 
  | 'SEMI_FORMAL' 
  | 'FORMAL' 
  | 'HOME' 
  | 'SHALWAR_KAMEEZ'

export type Gender = 'MEN' | 'WOMEN' | 'UNISEX'

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type OrderStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'REFUNDED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface Product {
  id: string
  name: string
  slug: string
  sku?: string
  shortDesc?: string
  description?: string
  designStory?: string
  type: ProductType
  gender: Gender
  status: ProductStatus
  price: number
  salePrice?: number
  stock: number
  weight?: number
  tags: string[]
  seoTitle?: string
  seoDesc?: string
  seoKeywords: string[]
  canonicalUrl?: string
  faqData?: any
  createdAt: Date
  updatedAt: Date
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  alt?: string
  order: number
  width?: number
  height?: number
  isPrimary: boolean
  createdAt: Date
}

export interface Variant {
  id: string
  productId: string
  sku: string
  name?: string
  options: {
    size?: string
    color?: string
    material?: string
    [key: string]: any
  }
  price: number
  stock: number
  weight?: number
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
}

