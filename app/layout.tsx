import type React from "react"
import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CookieConsent } from "@/components/cookie-consent"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  title: "Evalorio - AI Video & Image Scoring for Real Estate",
  description:
    "Upload property videos or images, get AI-powered analysis with room detection, quality scoring, location-based pricing, and auto-generated multilingual TikTok content in minutes.",
  keywords: [
    "real estate AI",
    "property analysis",
    "video scoring",
    "TikTok content",
    "property valuation",
    "real estate marketing",
    "AI property scoring",
    "real estate video analysis",
    "property image analysis",
    "automated real estate content",
    "multilingual property marketing",
    "AI real estate tools",
  ],
  authors: [{ name: "Evalorio" }],
  creator: "Evalorio",
  publisher: "Evalorio",
  generator: "v0.app",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://evalorio.vercel.app"),
  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon-196x196.png", sizes: "196x196", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/apple-touch-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/apple-touch-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/apple-touch-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/apple-touch-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-touch-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-touch-icon-167x167.png", sizes: "167x167", type: "image/png" },
      { url: "/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg",
        color: "#000000",
      },
    ],
  },

  manifest: "/manifest.json",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Evalorio",
    title: "Evalorio - AI Video & Image Scoring for Real Estate",
    description:
      "Upload property videos or images, get AI-powered analysis with room detection, quality scoring, location-based pricing, and auto-generated multilingual TikTok content in minutes.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Evalorio - AI Property Analysis Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Evalorio - AI Video & Image Scoring for Real Estate",
    description:
      "Upload property videos or images, get AI-powered analysis with room detection, quality scoring, and auto-generated TikTok content in minutes.",
    images: ["/og-image.jpg"],
    creator: "@evalorio",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />

        {/* Standard favicons */}
        <link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16" />
        <link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/png" href="/favicon-128x128.png" sizes="128x128" />
        <link rel="icon" type="image/png" href="/favicon-196x196.png" sizes="196x196" />

        {/* Apple Touch Icons - Precomposed */}
        <link rel="apple-touch-icon-precomposed" sizes="57x57" href="/apple-touch-icon-57x57.png" />
        <link rel="apple-touch-icon-precomposed" sizes="60x60" href="/apple-touch-icon-60x60.png" />
        <link rel="apple-touch-icon-precomposed" sizes="72x72" href="/apple-touch-icon-72x72.png" />
        <link rel="apple-touch-icon-precomposed" sizes="76x76" href="/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon-precomposed" sizes="114x114" href="/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon-precomposed" sizes="120x120" href="/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon-precomposed" sizes="144x144" href="/apple-touch-icon-144x144.png" />
        <link rel="apple-touch-icon-precomposed" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon-precomposed" sizes="167x167" href="/apple-touch-icon-167x167.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-180x180.png" />

        {/* Apple Touch Icons - Standard */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />

        {/* Android Chrome */}
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />

        {/* Microsoft Tiles */}
        <meta name="application-name" content="Evalorio" />
        <meta name="msapplication-TileColor" content="#FFFFFF" />
        <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
        <meta name="msapplication-square70x70logo" content="/mstile-70x70.png" />
        <meta name="msapplication-square150x150logo" content="/mstile-150x150.png" />
        <meta name="msapplication-wide310x150logo" content="/mstile-310x150.png" />
        <meta name="msapplication-square310x310logo" content="/mstile-310x310.png" />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Evalorio" />
        <meta name="mobile-web-app-capable" content="yes" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://evalorio.vercel.app/#organization",
                  name: "Evalorio",
                  url: "https://evalorio.vercel.app",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://evalorio.vercel.app/evalorio-logo.svg",
                    width: 272,
                    height: 50,
                  },
                  sameAs: ["https://twitter.com/evalorio"],
                  description: "AI-powered video and image analysis platform for real estate professionals",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://evalorio.vercel.app/#website",
                  url: "https://evalorio.vercel.app",
                  name: "Evalorio",
                  publisher: {
                    "@id": "https://evalorio.vercel.app/#organization",
                  },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://evalorio.vercel.app/search?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  name: "Evalorio",
                  applicationCategory: "BusinessApplication",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "EUR",
                  },
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: "4.8",
                    ratingCount: "127",
                  },
                  operatingSystem: "Web",
                  description:
                    "AI-powered video and image analysis for real estate with room detection, quality scoring, and automated marketing content generation",
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        {/* Cookie consent banner for GDPR compliance */}
        <CookieConsent />
      </body>
    </html>
  )
}
