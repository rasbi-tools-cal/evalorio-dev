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

/**
 * SEO-tool and scraper crawlers: they bring no visitors, but crawl every page they can find and
 * burn the hosting quota.
 */
const SEO_CRAWLERS = [
  "AhrefsBot",
  "AhrefsSiteAudit",
  "SemrushBot",
  "SiteAuditBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "DataForSeoBot",
  "SerpstatBot",
  "barkrowler",
  "PetalBot",
  "Seekport",
  "MauiBot",
  "ZoominfoBot",
]

// robots.txt is static: built once per deployment.
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production"
  if (!isProduction) return { rules: { userAgent: "*", disallow: "/" } }

  // "/filtered" is the internal dynamic twin of the search pages (next.config.mjs rewrites).
  const privatePaths = ["/account", "/post", "/admin", "/preview", "/login", "/signup", "/forgot-password", "/reset-password", "/filtered", "/api/"]
  const localized = ["es", "fr", "it", "pt"].flatMap((l) => privatePaths.filter((p) => p !== "/api/").map((p) => `/${l}${p}`))

  return {
    rules: [
      // "/*?": filter, sort and page combinations are endless and rendered on demand; listings are
      // all reachable through the sitemaps, so crawlers only need the clean URLs.
      { userAgent: "*", allow: "/", disallow: [...privatePaths, ...localized, "/*?"] },
      { userAgent: [...AI_CRAWLERS, ...SEO_CRAWLERS], disallow: "/" },
    ],
    // Index of every sitemap chunk (app/sitemap_index.xml/route.ts).
    sitemap: `${SITE_URL}/sitemap_index.xml`,
    host: SITE_URL,
  }
}
