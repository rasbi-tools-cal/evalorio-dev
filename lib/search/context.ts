import "server-only"
import type { Locale } from "@/i18n/routing"
import {
  COUNTRIES,
  countryByAnySlug,
  countryBySlug,
  parseSearchSlug,
  parseSearchSlugAnyLocale,
  type Category,
  type CountryCode,
  type Operation,
} from "@/lib/catalog"
import { createPublicClient } from "@/lib/supabase/public"
import { getCity, getNeighborhood } from "@/lib/listings/queries"
import { countryPath, searchPath } from "@/lib/urls"

export type SearchContext =
  | { kind: "country"; country: CountryCode }
  | {
      kind: "search"
      country: CountryCode
      city: { id: number; name: string; slug: string; region: string | null } | null
      neighborhood: { id: number; name: string; slug: string } | null
      category: Category
      operation: Operation
      center: [number, number]
      zoom: number
    }
  | { kind: "redirect"; path: string }
  | { kind: "notFound" }

/**
 * URL grammar (after the locale prefix):
 *   /{country}                                  country landing
 *   /{country}/{category-operation}             whole country
 *   /{country}/{city}/{category-operation}
 *   /{country}/{city}/{neighbourhood}/{category-operation}
 * /{country}/{city} and /{country}/{city}/{neighbourhood} redirect to "homes for sale".
 */
export async function resolveSearchContext(locale: Locale, countrySlug: string, segments: string[]): Promise<SearchContext> {
  const country = countryBySlug(countrySlug, locale)
  if (!country) {
    const other = countryByAnySlug(countrySlug)
    if (!other) return { kind: "notFound" }
    // Right country, wrong language: rebuild the whole path in this locale.
    const last = segments.at(-1)
    const parsed = last ? parseSearchSlugAnyLocale(last) : null
    if (!parsed) return { kind: "redirect", path: segments.length ? `${countryPath(locale, other.code)}/${segments.join("/")}` : countryPath(locale, other.code) }
    const rest = segments.slice(0, -1)
    return { kind: "redirect", path: searchPath(locale, { country: other.code, city: rest[0], neighborhood: rest[1], ...parsed }) }
  }

  if (segments.length === 0) return { kind: "country", country: country.code }
  if (segments.length > 3) return { kind: "notFound" }

  const last = segments[segments.length - 1]
  let parsed = parseSearchSlug(locale, last)
  const placeSegments = parsed ? segments.slice(0, -1) : segments

  if (!parsed) {
    const other = parseSearchSlugAnyLocale(last)
    if (other) {
      return {
        kind: "redirect",
        path: searchPath(locale, { country: country.code, city: placeSegments.slice(0, -1)[0], neighborhood: placeSegments.slice(0, -1)[1], ...other }),
      }
    }
    if (segments.length > 2) return { kind: "notFound" }
    parsed = { category: "homes", operation: "sale" }
  }

  if (placeSegments.length === 0) {
    return {
      kind: "search",
      country: country.code,
      city: null,
      neighborhood: null,
      ...parsed,
      center: country.center,
      zoom: country.zoom,
    }
  }

  const city = await getCity(country.code, placeSegments[0])
  if (!city) return { kind: "notFound" }
  const neighborhood = placeSegments[1] ? await getNeighborhood(city.id, placeSegments[1]) : null
  if (placeSegments[1] && !neighborhood) return { kind: "notFound" }

  // Bare place URL -> canonical "homes for sale" page.
  if (!parseSearchSlug(locale, last)) {
    return {
      kind: "redirect",
      path: searchPath(locale, { country: country.code, city: city.slug, neighborhood: neighborhood?.slug, ...parsed }),
    }
  }

  const { data: coords } = await createPublicClient().rpc("get_city", { p_id: city.id })
  const center: [number, number] = coords?.[0] ? [coords[0].lat, coords[0].lng] : COUNTRIES[country.code].center

  return {
    kind: "search",
    country: country.code,
    city: { id: city.id, name: city.name, slug: city.slug, region: city.region },
    neighborhood,
    ...parsed,
    center,
    zoom: neighborhood ? 14 : 12,
  }
}
