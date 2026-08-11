export function OrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zargeofficial.com'
  
  const organizationschema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Zargé",
    "url": baseUrl,
    "logo": `${baseUrl}${encodeURI("/img/ICON WHT LOGO TRANSPARANT.png")}`,
    "description": "Premium luxury fashion and home essentials. Discover elegant formal wear, semi-formal apparel, and curated home textiles.",
    "email": "customerservice@zargeofficial.com",
    "sameAs": [
      "https://instagram.com/zargeofficial"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "customerservice@zargeofficial.com",
      "url": `${baseUrl}/contact`
    },
    "areaServed": {
      "@type": "Country",
      "name": "Pakistan"
    },
    "brand": {
      "@type": "Brand",
      "name": "Zargé"
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Zargé",
    "alternateName": "Zarge",
    "url": baseUrl
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationschema) }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
    />
    </>
  )
}

