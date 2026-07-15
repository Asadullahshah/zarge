/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.pngkey.com',
      },
      {
        protocol: 'https',
        hostname: 'pngkey.com',
      },
      {
        protocol: 'https',
        hostname: 'www.nicepng.com',
      },
      {
        protocol: 'https',
        hostname: 'nicepng.com',
      },
    ],
    unoptimized: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/video/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      // The homepage links to /collections/<slug>; serve them via the generic category route
      {
        source: '/collections/:slug',
        destination: '/category/:slug',
        permanent: false,
      },
      // Retired taxonomy — send legacy category paths home
      { source: '/men', destination: '/', permanent: true },
      { source: '/women', destination: '/', permanent: true },
      { source: '/home-essentials', destination: '/', permanent: true },
    ]
  },
}

module.exports = nextConfig

