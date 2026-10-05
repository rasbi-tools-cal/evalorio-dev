import type { Metadata, Viewport } from "next"
import { SITE_URL } from "@/lib/env"
import "./globals.css"

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

/**
 * <html> and <body> are rendered by app/[locale]/layout.tsx, where the language comes from the URL.
 * Reading it here (getLocale) would fall back to request headers and make every page dynamic.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
