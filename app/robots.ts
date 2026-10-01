import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/env"

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production"
  if (!isProduction) return { rules: { userAgent: "*", disallow: "/" } }

  const privatePaths = ["/account", "/post", "/admin", "/login", "/signup", "/forgot-password", "/reset-password", "/api/"]
  const localized = ["es", "fr", "it", "pt"].flatMap((l) => privatePaths.filter((p) => p !== "/api/").map((p) => `/${l}${p}`))

  return {
    rules: { userAgent: "*", allow: "/", disallow: [...privatePaths, ...localized] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
