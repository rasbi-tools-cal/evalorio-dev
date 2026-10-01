import type { Locale } from "@/i18n/routing"
import { routing } from "@/i18n/routing"
import { COUNTRIES, provinceSegment, searchSlug, type Category, type CountryCode, type Operation } from "@/lib/catalog"
import { SITE_URL } from "@/lib/env"
import { slugify } from "@/lib/utils"

/** Paths here never include the locale prefix; next-intl's <Link> adds it. */

export function listingPath(id: number, title?: string | null) {
  const slug = slugify(title ?? "").slice(0, 80)
  return `/listing/${id}${slug ? `-${slug}` : ""}`
}

export function searchPath(
  locale: Locale,
  opts: {
    country: CountryCode
    /** Province slug; only used when there is no city (province landing pages). */
    province?: string | null
    city?: string | null
    neighborhood?: string | null
    category: Category
    operation: Operation
    query?: URLSearchParams | string
  },
) {
  const parts = [COUNTRIES[opts.country].slug[locale]]
  if (opts.province && !opts.city) parts.push(provinceSegment(locale, opts.country, opts.province))
  if (opts.city) parts.push(opts.city)
  if (opts.city && opts.neighborhood) parts.push(opts.neighborhood)
  parts.push(searchSlug(locale, opts.category, opts.operation))
  const query = opts.query?.toString()
  return `/${parts.join("/")}${query ? `?${query}` : ""}`
}

export function countryPath(locale: Locale, country: CountryCode) {
  return `/${COUNTRIES[country].slug[locale]}`
}

export function localizedPath(locale: Locale, path: string) {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`
  return path === "/" ? prefix || "/" : `${prefix}${path}`
}

export function absoluteUrl(locale: Locale, path: string) {
  return `${SITE_URL}${localizedPath(locale, path)}`
}

/** Only allow same-site relative redirects ("/account", not "//evil.com" or "https://..."). */
export function safeNextPath(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback
  return next
}
