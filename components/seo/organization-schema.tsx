export function OrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.noirefit.com'
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Zarge",
    "url": baseUrl,
    "logo": `${baseUrl}/img/ICON WHT LOGO TRANSPARANT.png`,
    "description": "Premium luxury fashion and home essentials. Discover elegant formal wear, semi-formal apparel, and curated home textiles.",
    "sameAs": [
      // Add social media links if available
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "url": `${baseUrl}/contact`
    },
    "areaServed": {
      "@type": "Country",
      "name": "Pakistan"
    },
    "brand": {
      "@type": "Brand",
      "name": "Zarge"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

