import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/env"

/**
 * AI training / answer-engine crawlers: blocked site-wide. Search engines (Googlebot, Bingbot...) are
 * not affected. Note: "Google-Extended" and "Applebot-Extended" only opt out of AI training; normal
 * Google and Apple search indexing continues.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot",
  "Bytespider",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "FacebookBot",
  "Amazonbot",
  "cohere-ai",
  "Diffbot",
  "Omgilibot",
  "YouBot",
  "DuckAssistBot",
  "Timpibot",
  "ImagesiftBot",
]

// robots.txt is static: built once per deployment.
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production"
  if (!isProduction) return { rules: { userAgent: "*", disallow: "/" } }

  const privatePaths = ["/account", "/post", "/admin", "/preview", "/login", "/signup", "/forgot-password", "/reset-password", "/api/"]
  const localized = ["es", "fr", "it", "pt"].flatMap((l) => privatePaths.filter((p) => p !== "/api/").map((p) => `/${l}${p}`))

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: [...privatePaths, ...localized] },
      { userAgent: AI_CRAWLERS, disallow: "/" },
    ],
    // Index of every sitemap chunk (app/sitemap_index.xml/route.ts).
    sitemap: `${SITE_URL}/sitemap_index.xml`,
    host: SITE_URL,
  }
}
