import createMDX from "@next/mdx"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

// Blog articles (content/blog/<locale>/<slug>.mdx) are imported by app/[locale]/blog, never routed as pages.
// Plugin names as strings so they work with Turbopack. Frontmatter is parsed separately (lib/blog/posts.ts).
const withMDX = createMDX({
  options: { remarkPlugins: ["remark-frontmatter", "remark-gfm"] },
})

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321")
const isDev = process.env.NODE_ENV !== "production"

// Map tiles + Supabase (API, storage, realtime) + Turnstile. Everything else is same-origin.
const mapTileOrigins = (process.env.NEXT_PUBLIC_MAP_TILE_ORIGINS || "https://tile.openstreetmap.org https://*.tile.openstreetmap.org")
  .split(/\s+/)
  .filter(Boolean)
  .join(" ")

const contentSecurityPolicy = [
  "default-src 'self'",
  // Vercel Analytics loads its debug script from va.vercel-scripts.com in development only.
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseUrl.origin} ${mapTileOrigins}`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseUrl.origin} ${supabaseUrl.origin.replace(/^http/, "ws")}`,
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ")

// Language routing ("as-needed" prefix) lives here instead of in proxy.ts, so anonymous page views
// are served straight from the CDN without invoking a function. English has no prefix: "/spain/..."
// is served by app/[locale] as "/en/spain/...", and "/en/..." redirects to the unprefixed URL.
// Keep in sync with i18n/routing.ts.
const PREFIXED_LOCALES = ["es", "fr", "it", "pt"]

// Search pages are static (ISR); a URL carrying any search parameter goes to the dynamic twin at
// app/[locale]/filtered. Keep in sync with lib/search/filters.ts (parseFilters) and the country
// slugs in lib/catalog.ts (COUNTRIES[*].slug).
const SEARCH_PARAMS = ["types", "price_min", "price_max", "beds", "baths", "area_min", "area_max", "features", "bbox", "sort", "page", "view"]
const COUNTRY_SLUGS = "spain|espana|espagne|spagna|espanha|france|francia|franca|italy|italia|italie|portugal|portogallo"

const searchRewrites = SEARCH_PARAMS.flatMap((key) => [
  {
    source: `/:locale(${PREFIXED_LOCALES.join("|")})/:country(${COUNTRY_SLUGS})/:segments*`,
    has: [{ type: "query", key }],
    destination: "/:locale/filtered/:country/:segments*",
  },
  { source: `/:country(${COUNTRY_SLUGS})/:segments*`, has: [{ type: "query", key }], destination: "/en/filtered/:country/:segments*" },
])

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Legal pages read content/legal/<locale>/*.md at runtime.
  outputFileTracingIncludes: { "/[locale]/**": ["./content/legal/**/*.md", "./content/blog/**/*.mdx"], "/sitemap/**": ["./content/blog/**/*.mdx"] },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol.replace(":", ""),
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: "/storage/v1/object/public/listing-photos/**",
      },
    ],
    // Local Supabase runs on 127.0.0.1; never allowed in production (SSRF).
    dangerouslyAllowLocalIP: isDev,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
    ]
  },
  async rewrites() {
    return {
      // beforeFiles entries apply in sequence, so these already carry the final locale.
      beforeFiles: searchRewrites,
      // afterFiles run after public files and static routes (robots.txt, sitemap_index.xml, api/*)
      // but before dynamic routes, so only unprefixed page paths get the English locale.
      afterFiles: [
        { source: "/", destination: "/en" },
        { source: `/:first((?!(?:en|${PREFIXED_LOCALES.join("|")}|api|_next|_vercel|sitemap)(?:/|$))[^/]+)/:rest*`, destination: "/en/:first/:rest*" },
      ],
    }
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
        ],
      },
    ]
  },
}

export default withNextIntl(withMDX(nextConfig))
