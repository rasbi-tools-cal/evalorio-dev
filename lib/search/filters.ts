import { FEATURES, PROPERTY_TYPES, type Feature, type PropertyType } from "@/lib/catalog"

/** Query-string filters on search pages. Path segments carry country/city/category/operation. */
export interface SearchFilters {
  types?: PropertyType[]
  priceMin?: number
  priceMax?: number
  bedrooms?: number
  bathrooms?: number
  areaMin?: number
  areaMax?: number
  features?: Feature[]
  bbox?: [number, number, number, number] // west, south, east, north
  sort: SortKey
  page: number
  view: "list" | "map"
}

export const SORT_KEYS = ["newest", "price_asc", "price_desc", "area_desc", "price_m2_asc"] as const
export type SortKey = (typeof SORT_KEYS)[number]

export const PAGE_SIZE = 24
export const MAX_PAGE = 100

type Params = Record<string, string | string[] | undefined>

function one(params: Params, key: string) {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

/** Multi-value params arrive either comma-joined (our links) or repeated (native GET forms). */
function many(params: Params, key: string) {
  const v = params[key]
  return Array.isArray(v) ? v.join(",") : v
}

function int(value: string | undefined, min: number, max: number) {
  if (!value || !/^\d{1,9}$/.test(value)) return undefined
  const n = Number(value)
  return n >= min && n <= max ? n : undefined
}

function list<T extends string>(value: string | undefined, allowed: readonly T[]) {
  if (!value) return undefined
  const items = value.split(",").filter((v): v is T => (allowed as readonly string[]).includes(v))
  return items.length ? Array.from(new Set(items)) : undefined
}

export function parseFilters(params: Params): SearchFilters {
  const bboxRaw = one(params, "bbox")?.split(",").map(Number)
  const bbox =
    bboxRaw?.length === 4 &&
    bboxRaw.every(Number.isFinite) &&
    bboxRaw[0] >= -180 && bboxRaw[2] <= 180 && bboxRaw[1] >= -90 && bboxRaw[3] <= 90 &&
    bboxRaw[0] < bboxRaw[2] && bboxRaw[1] < bboxRaw[3]
      ? (bboxRaw.map((n) => Math.round(n * 1e5) / 1e5) as [number, number, number, number])
      : undefined

  const sort = one(params, "sort")
  return {
    types: list(many(params, "types"), PROPERTY_TYPES),
    priceMin: int(one(params, "price_min"), 0, 100_000_000),
    priceMax: int(one(params, "price_max"), 0, 100_000_000),
    bedrooms: int(one(params, "beds"), 0, 10),
    bathrooms: int(one(params, "baths"), 0, 10),
    areaMin: int(one(params, "area_min"), 0, 100_000),
    areaMax: int(one(params, "area_max"), 0, 100_000),
    features: list(many(params, "features"), FEATURES),
    bbox,
    sort: (SORT_KEYS as readonly string[]).includes(sort ?? "") ? (sort as SortKey) : "newest",
    page: int(one(params, "page"), 1, MAX_PAGE) ?? 1,
    view: one(params, "view") === "map" ? "map" : "list",
  }
}

/** Canonical query string (stable key order, defaults omitted). */
export function filtersToQuery(f: Partial<SearchFilters>, { withPage = true, withView = true } = {}) {
  const q = new URLSearchParams()
  if (f.types?.length) q.set("types", f.types.join(","))
  if (f.priceMin != null) q.set("price_min", String(f.priceMin))
  if (f.priceMax != null) q.set("price_max", String(f.priceMax))
  if (f.bedrooms != null) q.set("beds", String(f.bedrooms))
  if (f.bathrooms != null) q.set("baths", String(f.bathrooms))
  if (f.areaMin != null) q.set("area_min", String(f.areaMin))
  if (f.areaMax != null) q.set("area_max", String(f.areaMax))
  if (f.features?.length) q.set("features", [...f.features].sort().join(","))
  if (f.bbox) q.set("bbox", f.bbox.join(","))
  if (f.sort && f.sort !== "newest") q.set("sort", f.sort)
  if (withView && f.view === "map") q.set("view", "map")
  if (withPage && f.page && f.page > 1) q.set("page", String(f.page))
  return q
}

/** Any filter that narrows results (pages with these are noindex to avoid thin duplicates). */
export function hasNarrowingFilters(f: SearchFilters) {
  return Boolean(
    f.types || f.priceMin != null || f.priceMax != null || f.bedrooms != null || f.bathrooms != null ||
      f.areaMin != null || f.areaMax != null || f.features || f.bbox || f.sort !== "newest",
  )
}

export function toRpcArgs(
  f: SearchFilters,
  scope: {
    operation: "sale" | "rent"
    country?: string
    provinceId?: number
    cityId?: number
    neighborhoodId?: number
    types: PropertyType[]
  },
) {
  const types = f.types?.filter((t) => scope.types.includes(t))
  return {
    p_operation: scope.operation,
    p_country: scope.country,
    p_province_id: scope.provinceId,
    p_city_id: scope.cityId,
    p_neighborhood_id: scope.neighborhoodId,
    p_types: types?.length ? types : scope.types,
    p_price_min: f.priceMin,
    p_price_max: f.priceMax,
    p_bedrooms_min: f.bedrooms,
    p_bathrooms_min: f.bathrooms,
    p_area_min: f.areaMin,
    p_area_max: f.areaMax,
    p_features: f.features,
    p_west: f.bbox?.[0],
    p_south: f.bbox?.[1],
    p_east: f.bbox?.[2],
    p_north: f.bbox?.[3],
  }
}

/** Stored in saved_searches.filters — everything needed to re-run the search later. */
export interface SavedSearchFilters {
  country: string
  provinceId?: number
  cityId?: number
  neighborhoodId?: number
  category: string
  operation: "sale" | "rent"
  query: string
}
