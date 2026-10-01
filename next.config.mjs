import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321")
const isDev = process.env.NODE_ENV !== "production"

// Map tiles + Supabase (API, storage, realtime) + Turnstile. Everything else is same-origin.
const mapTileOrigins = (process.env.NEXT_PUBLIC_MAP_TILE_ORIGINS || "https://tile.openstreetmap.org https://*.tile.openstreetmap.org")
  .split(/\s+/)
  .filter(Boolean)
  .join(" ")

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
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

export default withNextIntl(nextConfig)
