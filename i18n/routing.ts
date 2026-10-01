import { defineRouting } from "next-intl/routing"

export const locales = ["en", "es", "fr", "it", "pt"] as const
export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  // English lives at the root ("/spain/madrid/..."), other languages are prefixed ("/es/espana/...").
  localePrefix: "as-needed",
  // Never auto-redirect by Accept-Language: crawlers and shared links must always get the URL they asked for.
  localeDetection: false,
  // hreflang alternates are emitted per page (localized slugs differ), see lib/seo/metadata.ts.
  alternateLinks: false,
})
