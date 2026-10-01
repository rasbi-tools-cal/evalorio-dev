import type { Locale } from "@/i18n/routing"

/** Static catalog: countries, property categories and their localized URL slugs. */

export const COUNTRY_CODES = ["ES", "FR", "IT", "PT"] as const
export type CountryCode = (typeof COUNTRY_CODES)[number]

export const OPERATIONS = ["sale", "rent"] as const
export type Operation = (typeof OPERATIONS)[number]

export const PROPERTY_TYPES = [
  "apartment",
  "penthouse",
  "duplex",
  "studio",
  "house",
  "villa",
  "country_house",
  "room",
  "land",
  "commercial",
  "office",
  "garage",
] as const
export type PropertyType = (typeof PROPERTY_TYPES)[number]

export const FEATURES = [
  "elevator",
  "parking",
  "terrace",
  "balcony",
  "garden",
  "pool",
  "air_conditioning",
  "heating",
  "furnished",
  "storage_room",
  "built_in_wardrobes",
  "accessible",
  "pets_allowed",
  "sea_view",
  "doorman",
] as const
export type Feature = (typeof FEATURES)[number]

export const ENERGY_RATINGS = ["A", "B", "C", "D", "E", "F", "G", "exempt", "pending"] as const

interface CountryInfo {
  code: CountryCode
  slug: Record<Locale, string>
  center: [number, number]
  zoom: number
  /** City slugs shown on the home and country pages (biggest markets). */
  featuredCities: string[]
}

export const COUNTRIES: Record<CountryCode, CountryInfo> = {
  ES: {
    code: "ES",
    slug: { en: "spain", es: "espana", fr: "espagne", it: "spagna", pt: "espanha" },
    center: [40.2, -3.7],
    zoom: 6,
    featuredCities: ["madrid", "barcelona", "valencia", "sevilla", "malaga", "palma", "alicante", "bilbao"],
  },
  FR: {
    code: "FR",
    slug: { en: "france", es: "francia", fr: "france", it: "francia", pt: "franca" },
    center: [46.6, 2.4],
    zoom: 6,
    featuredCities: ["paris", "marseille", "lyon", "toulouse", "nice", "bordeaux", "nantes", "montpellier"],
  },
  IT: {
    code: "IT",
    slug: { en: "italy", es: "italia", fr: "italie", it: "italia", pt: "italia" },
    center: [42.5, 12.5],
    zoom: 6,
    featuredCities: ["roma", "milano", "napoli", "torino", "firenze", "bologna", "genova", "palermo"],
  },
  PT: {
    code: "PT",
    slug: { en: "portugal", es: "portugal", fr: "portugal", it: "portogallo", pt: "portugal" },
    center: [39.6, -8.0],
    zoom: 7,
    featuredCities: ["lisboa", "porto", "braga", "coimbra", "funchal", "faro", "aveiro", "setubal"],
  },
}

export function countryBySlug(slug: string, locale: Locale): CountryInfo | undefined {
  return Object.values(COUNTRIES).find((c) => c.slug[locale] === slug)
}

/** Country slug in any language → country (used to redirect to the right language's slug). */
export function countryByAnySlug(slug: string): CountryInfo | undefined {
  return Object.values(COUNTRIES).find((c) => Object.values(c.slug).includes(slug))
}

/** SEO categories group property types into the pages people search for. */
export const CATEGORIES = ["homes", "apartments", "houses", "rooms", "land", "commercial", "garages"] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_TYPES: Record<Category, PropertyType[]> = {
  homes: ["apartment", "penthouse", "duplex", "studio", "house", "villa", "country_house"],
  apartments: ["apartment", "penthouse", "duplex", "studio"],
  houses: ["house", "villa", "country_house"],
  rooms: ["room"],
  land: ["land"],
  commercial: ["commercial", "office"],
  garages: ["garage"],
}

export function categoryForType(type: PropertyType): Category {
  if (CATEGORY_TYPES.apartments.includes(type)) return "apartments"
  if (CATEGORY_TYPES.houses.includes(type)) return "houses"
  return (CATEGORIES.find((c) => c !== "homes" && CATEGORY_TYPES[c].includes(type)) ?? "homes") as Category
}

const CATEGORY_WORD: Record<Locale, Record<Category, string>> = {
  en: {
    homes: "homes",
    apartments: "apartments",
    houses: "houses",
    rooms: "rooms",
    land: "land",
    commercial: "commercial-properties",
    garages: "garages",
  },
  es: {
    homes: "viviendas",
    apartments: "pisos",
    houses: "casas",
    rooms: "habitaciones",
    land: "terrenos",
    commercial: "locales",
    garages: "garajes",
  },
  fr: {
    homes: "logements",
    apartments: "appartements",
    houses: "maisons",
    rooms: "chambres",
    land: "terrains",
    commercial: "locaux-commerciaux",
    garages: "garages",
  },
  it: {
    homes: "case",
    apartments: "appartamenti",
    houses: "case-indipendenti",
    rooms: "stanze",
    land: "terreni",
    commercial: "locali-commerciali",
    garages: "garage",
  },
  pt: {
    homes: "casas",
    apartments: "apartamentos",
    houses: "moradias",
    rooms: "quartos",
    land: "terrenos",
    commercial: "espacos-comerciais",
    garages: "garagens",
  },
}

const OPERATION_SUFFIX: Record<Locale, Record<Operation, string>> = {
  en: { sale: "for-sale", rent: "for-rent" },
  es: { sale: "en-venta", rent: "en-alquiler" },
  fr: { sale: "a-vendre", rent: "a-louer" },
  it: { sale: "in-vendita", rent: "in-affitto" },
  pt: { sale: "para-venda", rent: "para-arrendar" },
}

/** Categories that make sense per operation (no "rooms for sale"). */
export function categoriesFor(operation: Operation): Category[] {
  return CATEGORIES.filter((c) => !(operation === "sale" && c === "rooms"))
}

export function searchSlug(locale: Locale, category: Category, operation: Operation): string {
  return `${CATEGORY_WORD[locale][category]}-${OPERATION_SUFFIX[locale][operation]}`
}

export function parseSearchSlug(locale: Locale, slug: string): { category: Category; operation: Operation } | null {
  for (const operation of OPERATIONS) {
    for (const category of categoriesFor(operation)) {
      if (searchSlug(locale, category, operation) === slug) return { category, operation }
    }
  }
  return null
}

/** Same search slug written in another language (for redirecting mismatched URLs). */
export function parseSearchSlugAnyLocale(slug: string) {
  for (const locale of Object.keys(CATEGORY_WORD) as Locale[]) {
    const parsed = parseSearchSlug(locale, slug)
    if (parsed) return parsed
  }
  return null
}

export const REPORT_REASONS = [
  "scam",
  "wrong_info",
  "already_sold",
  "duplicate",
  "offensive",
  "agency_posing_as_owner",
  "other",
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

/** What the province level is called in each country (GeoNames admin2; districts in Portugal). */
export const PROVINCE_KIND: Record<CountryCode, "province" | "department" | "district"> = {
  ES: "province",
  FR: "department",
  IT: "province",
  PT: "district",
}

const PROVINCE_PREFIX: Record<Locale, Record<"province" | "department" | "district", string>> = {
  en: { province: "province", department: "department", district: "district" },
  es: { province: "provincia", department: "departamento", district: "distrito" },
  fr: { province: "province", department: "departement", district: "district" },
  it: { province: "provincia", department: "dipartimento", district: "distretto" },
  pt: { province: "provincia", department: "departamento", district: "distrito" },
}

/** URL segment of a province page: /spain/province-valencia/..., /es/espana/provincia-valencia/... */
export function provinceSegment(locale: Locale, country: CountryCode, slug: string) {
  return `${PROVINCE_PREFIX[locale][PROVINCE_KIND[country]]}-${slug}`
}

export function parseProvinceSegment(locale: Locale, country: CountryCode, segment: string) {
  const prefix = `${PROVINCE_PREFIX[locale][PROVINCE_KIND[country]]}-`
  return segment.startsWith(prefix) ? segment.slice(prefix.length) : null
}
