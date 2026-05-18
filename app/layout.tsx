import type { Metadata } from "next"
import { Inter, Playfair_Display, Montserrat } from "next/font/google"
import "./globals.css"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footerV2"
import { AuthProvider } from "@/components/providers/session-provider"
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper"
import { NetworkStatus } from "@/components/network-status"
import { OrganizationSchema } from "@/components/seo/organization-schema"
import { ScrollToHash } from "@/components/ScrollToHash"
import { headers } from "next/headers"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.noirefit.com'),
  title: {
    default: "Zarge - Premium Luxury Fashion & Home Essentials",
    template: "%s | Zarge"
  },
  description: "Shop premium luxury fashion and home essentials. Discover elegant formal wear, semi-formal apparel, and curated home textiles from Zarge. Premium clothing for men and women, plus exclusive home essentials including bedsheets, quilts, blankets, and more.",
  keywords: [
    "premium clothing",
    "luxury fashion",
    "home essentials",
    "premium fashion",
    "formal wear",
    "semi-formal apparel",
    "premium home textiles",
    "luxury bedsheets",
    "premium quilts",
    "designer clothing",
    "high-end fashion",
    "premium home decor",
    "luxury clothing Pakistan",
    "premium fashion store",
    "home essentials store"
  ],
  authors: [{ name: "Zarge" }],
  creator: "Zarge",
  publisher: "Zarge",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.noirefit.com',
    siteName: "Zarge",
    title: "Zarge - Premium Luxury Fashion & Home Essentials",
    description: "Shop premium luxury fashion and home essentials. Discover elegant formal wear, semi-formal apparel, and curated home textiles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zarge - Premium Luxury Fashion & Home Essentials",
    description: "Shop premium luxury fashion and home essentials. Discover elegant formal wear, semi-formal apparel, and curated home textiles.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-Zarge/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "public/favicon-Zarge/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "public/favicon-Zarge/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "manifest",
        url: "/favicon/site.webmanifest",
      },
    ],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.noirefit.com',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const isAdmin = pathname.startsWith("/admin")

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${montserrat.variable}`}>
      <body className={'${inter.className} bg-transparent'}>

        {/* Global background — hidden on admin pages */}
        {!isAdmin && (
          <div className="fixed inset-0 z-0">
            <Image
              src="/img/Background.jpeg"
              alt=""
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        )}

        {/* All content sits above the background */}
        <div className="relative z-10">
          <OrganizationSchema />
          <ErrorBoundaryWrapper>
            <AuthProvider>
              <NetworkStatus />
              {!isAdmin && <Header />}
              <ScrollToHash />
              {children}
              {!isAdmin && <Footer />}
            </AuthProvider>
          </ErrorBoundaryWrapper>
        </div>

      </body>
    </html>
  )
}