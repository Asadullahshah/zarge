import { Product, Category } from "@/lib/types"

interface ProductSchemaProps {
  product: any
}

export function ProductSchema({ product }: ProductSchemaProps) {
  const price = parseFloat(product.sale_price || product.price)
  const originalPrice = product.sale_price ? parseFloat(product.price) : null
  const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0]

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_desc || product.description,
    image: primaryImage ? primaryImage.url : undefined,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "Zarge",
    },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/product/${product.slug}`,
      priceCurrency: "PKR",
      price: price.toString(),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      ...(originalPrice && {
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      }),
    },
    ...(product.faq_data && {
      mainEntity: {
        "@type": "FAQPage",
        mainEntity: product.faq_data.map((faq: any) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface BreadcrumbSchemaProps {
  items: Array<{ name: string; url: string }>
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

