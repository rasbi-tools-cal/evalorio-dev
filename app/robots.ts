import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/env"
import { generateSitemaps } from "./sitemap"

export const revalidate = 3600

// Sitemaps are split (generateSitemaps), so there is no /sitemap.xml: list every chunk.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const sitemaps = await generateSitemaps()
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production"
  if (!isProduction) return { rules: { userAgent: "*", disallow: "/" } }

  const privatePaths = ["/account", "/post", "/admin", "/login", "/signup", "/forgot-password", "/reset-password", "/api/"]
  const localized = ["es", "fr", "it", "pt"].flatMap((l) => privatePaths.filter((p) => p !== "/api/").map((p) => `/${l}${p}`))

  return {
    rules: { userAgent: "*", allow: "/", disallow: [...privatePaths, ...localized] },
    sitemap: sitemaps.map(({ id }) => `${SITE_URL}/sitemap/${id}.xml`),
    host: SITE_URL,
  }
}
