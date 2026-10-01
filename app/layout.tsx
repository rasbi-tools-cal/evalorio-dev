import type { Metadata, Viewport } from "next"
import { Inter, Outfit } from "next/font/google"
import { getLocale } from "next-intl/server"
import { SITE_URL } from "@/lib/env"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" })
const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-outfit", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Evalorio",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/icon-light-32x32.png", sizes: "32x32" }],
    apple: [{ url: "/apple-touch-icon-180x180.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#006948",
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
