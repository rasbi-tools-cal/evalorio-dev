import type { MetadataRoute } from "next"
import { routing, type Locale } from "@/i18n/routing"
import { COUNTRIES, COUNTRY_CODES } from "@/lib/catalog"
import { createPublicClient } from "@/lib/supabase/public"
import { absoluteUrl, countryPath, listingPath, searchPath } from "@/lib/urls"

export const revalidate = 3600

const LISTINGS_PER_SITEMAP = 5000

function alternates(pathFor: (l: Locale) => string) {
  return { languages: Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(l, pathFor(l))])) }
}

/** id 0: home, countries, city landing searches. id 1..n: active listings. */
export async function generateSitemaps() {
  const { count } = await createPublicClient()
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
  const chunks = Math.max(1, Math.ceil((count ?? 0) / LISTINGS_PER_SITEMAP))
  return [{ id: 0 }, ...Array.from({ length: chunks }, (_, i) => ({ id: i + 1 }))]
}

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const chunk = Number(await id)
  const supabase = createPublicClient()

  if (chunk === 0) {
    const entries: MetadataRoute.Sitemap = []
    const home = () => "/"
    entries.push({ url: absoluteUrl("en", "/"), changeFrequency: "daily", priority: 1, alternates: alternates(home) })

    for (const code of COUNTRY_CODES) {
      entries.push({
        url: absoluteUrl("en", countryPath("en", code)),
        changeFrequency: "daily",
        priority: 0.8,
        alternates: alternates((l) => countryPath(l, code)),
      })
      for (const operation of ["sale", "rent"] as const) {
        entries.push({
          url: absoluteUrl("en", searchPath("en", { country: code, category: "homes", operation })),
          changeFrequency: "daily",
          priority: 0.8,
          alternates: alternates((l) => searchPath(l, { country: code, category: "homes", operation })),
        })
      }
    }

    // City pages that actually have listings (no empty/thin pages in the index).
    const { data } = await supabase
      .from("listings")
      .select("operation, country_code, city:cities(slug, province:provinces(slug))")
      .eq("status", "active")
    const seen = new Set<string>()
    for (const row of data ?? []) {
      const city = row.city?.slug
      if (!city || !row.country_code) continue
      const key = `${row.country_code}/${city}/${row.operation}`
      if (seen.has(key)) continue
      seen.add(key)
      const country = row.country_code as keyof typeof COUNTRIES
      const province = row.city?.province?.slug
      const provinceKey = `${row.country_code}/p/${province}/${row.operation}`
      if (province && !seen.has(provinceKey)) {
        seen.add(provinceKey)
        entries.push({
          url: absoluteUrl("en", searchPath("en", { country, province, category: "homes", operation: row.operation })),
          changeFrequency: "daily",
          priority: 0.7,
          alternates: alternates((l) => searchPath(l, { country, province, category: "homes", operation: row.operation })),
        })
      }
      entries.push({
        url: absoluteUrl("en", searchPath("en", { country, city, category: "homes", operation: row.operation })),
        changeFrequency: "daily",
        priority: 0.7,
        alternates: alternates((l) => searchPath(l, { country, city, category: "homes", operation: row.operation })),
      })
    }
    return entries
  }

  const from = (chunk - 1) * LISTINGS_PER_SITEMAP
  const { data } = await supabase
    .from("listings")
    .select("id, title, updated_at")
    .eq("status", "active")
    .order("id")
    .range(from, from + LISTINGS_PER_SITEMAP - 1)

  return (data ?? []).map((listing) => ({
    url: absoluteUrl("en", listingPath(listing.id, listing.title)),
    lastModified: listing.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    alternates: alternates((l) => listingPath(listing.id, listing.title)),
  }))
}
