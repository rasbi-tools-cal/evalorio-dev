import type { Operation, PropertyType } from "@/lib/catalog"

type Translator = (key: string, values?: Record<string, string | number>) => string

/** Owner-provided title, or a descriptive fallback like "Apartment for sale in Madrid". */
export function displayTitle(
  listing: { title: string | null; property_type: PropertyType; operation: Operation; city?: string | null },
  t: { types: Translator; phrase: Translator },
) {
  if (listing.title) return listing.title
  const base = `${t.types(listing.property_type)} ${t.phrase(listing.operation)}`
  return listing.city ? `${base} · ${listing.city}` : base
}

const NEW_MS = 3 * 24 * 60 * 60 * 1000

/** Published in the last 3 days (cards are server-rendered, so no hydration mismatch). */
export function isNewListing(publishedAt: string) {
  return Date.now() - new Date(publishedAt).getTime() < NEW_MS
}

export function pricePerSqm(price: number | null, area: number | null) {
  if (!price || !area) return null
  return Math.round(price / area)
}
