import type { Metadata } from "next"
import { Inter, Playfair_Display, Montserrat } from "next/font/google"
import "./globals.css"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { sql } from "@/lib/db"
import { Footer } from "@/components/layout/footerV2"
import { AuthProvider } from "@/components/providers/session-provider"
import { CartProvider } from "@/context/cart-context"
import { MiniCart } from "@/components/mini-cart"
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper"
import { NetworkStatus } from "@/components/network-status"
import { OrganizationSchema } from "@/components/seo/organization-schema"
import { ScrollToHash } from "@/components/ScrollToHash"
import { SmoothScroll } from "@/components/providers/smooth-scroll"
import NextTopLoader from "nextjs-toploader"
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zargeofficial.com'),
  title: {
    default: "Wearable narratives stitched through embroidery | Zarge",
    template: "%s | Zarge"
  },
  description: "Zargé is embroidered essentials, not fast fashion. Oversized silhouettes in premium French Cotton Terry, where every stitch carries a story worn, not told.",
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
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zargeofficial.com',
    siteName: "Zarge",
    title: "Wearable narratives stitched through embroidery | Zarge",
    description: "Zargé is embroidered essentials, not fast fashion. Oversized silhouettes in premium French Cotton Terry, where every stitch carries a story worn, not told.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wearable narratives stitched through embroidery | Zarge",
    description: "Zargé is embroidered essentials, not fast fashion. Oversized silhouettes in premium French Cotton Terry, where every stitch carries a story worn, not told.",
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
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "public/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "public/favicon/favicon.ico", sizes: "any" },
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
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.zargeofficial.com',
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
  const isCartPage = pathname.startsWith("/cart")
  const isHomePage = pathname === "/"

  let bannerEnabled = false
  let bannerMessage = ""
  if (!isAdmin) {
    const rows = await sql`SELECT enabled, message FROM site_settings WHERE key = 'promo_banner'`
    bannerEnabled = rows[0]?.enabled ?? false
    bannerMessage = rows[0]?.message ?? ""
  }

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${montserrat.variable}`}>
      <body className={`${inter.className} bg-white`}>

        <NextTopLoader
          color="#B8960C"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #B8960C,0 0 5px #B8960C"
          zIndex={1600}
        />


        {!isHomePage && (
          <div className="fixed inset-0 z-0">
            <Image
              src="/img/Background.jpeg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority
            />
          </div>
        )}

        {/* All content sits above the background */}
        <div className="relative z-10 flex min-h-screen flex-col">
          <OrganizationSchema />
          <ErrorBoundaryWrapper>
            <AuthProvider>
              <CartProvider>
                <NetworkStatus />
                {!isAdmin && <Header bannerEnabled={bannerEnabled} bannerMessage={bannerMessage} />}
                <ScrollToHash />
                <SmoothScroll enabled={!isAdmin}>
                  <main className={`flex flex-1 flex-col ${isHomePage ? "" : "bg-white"}`}>{children}</main>
                </SmoothScroll>
                {!isAdmin && <Footer />}
                <MiniCart />
              </CartProvider>
            </AuthProvider>
          </ErrorBoundaryWrapper>
        </div>

      </body>
    </html>
  )
}