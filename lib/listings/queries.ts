import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cache } from "react"
import type { Category, CountryCode, Operation, PropertyType } from "@/lib/catalog"
import { CATEGORY_TYPES } from "@/lib/catalog"
import type { Database } from "@/lib/database.types"
import { PAGE_SIZE, toRpcArgs, type SearchFilters } from "@/lib/search/filters"
import { createPublicClient } from "@/lib/supabase/public"
import { createClient } from "@/lib/supabase/server"

export interface ListingSummary {
  id: number
  title: string | null
  operation: Operation
  property_type: PropertyType
  price: number
  area_m2: number
  bedrooms: number | null
  bathrooms: number | null
  features: string[]
  published_at: string
  city: string
  city_slug: string
  country_code: CountryCode
  neighborhood: string | null
  lat: number
  lng: number
  photos: string[]
  photo_count?: number
  // Card details (search RPC); optional so older callers and RPC versions still type-check.
  excerpt?: string
  previous_price?: number | null
  floor?: number | null
  exterior?: boolean | null
  seller_type?: "private" | "agency"
  has_phone?: boolean
}

export interface MapMarker {
  id: number
  price: number
  lat: number
  lng: number
}

export interface SearchScope {
  operation: Operation
  category: Category
  country?: CountryCode
  provinceId?: number
  cityId?: number
  neighborhoodId?: number
}

export async function searchListings(scope: SearchScope, filters: SearchFilters) {
  const supabase = createPublicClient()
  const args = toRpcArgs(filters, { ...scope, types: CATEGORY_TYPES[scope.category] })
  const [{ data, error }, markers] = await Promise.all([
    supabase.rpc("search_listings", {
      ...args,
      p_sort: filters.sort,
      p_limit: PAGE_SIZE,
      p_offset: (filters.page - 1) * PAGE_SIZE,
    }),
    supabase.rpc("search_listing_markers", args),
  ])
  if (error) throw error
  const result = data as unknown as { total: number; items: ListingSummary[] }
  return { total: result.total, items: result.items, markers: (markers.data ?? []) as MapMarker[] }
}

export async function latestListings(opts: { country?: CountryCode; limit?: number; operation?: Operation } = {}) {
  const supabase = createPublicClient()
  const { data } = await supabase.rpc("search_listings", {
    p_operation: opts.operation ?? "sale",
    p_country: opts.country,
    p_limit: opts.limit ?? 8,
  })
  return ((data as unknown as { items: ListingSummary[] } | null)?.items ?? []) as ListingSummary[]
}

export const getCity = cache(async (country: CountryCode, slug: string) => {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug, region, country_code, population, province:provinces(id, name, slug)")
    .eq("country_code", country)
    .eq("slug", slug)
    .maybeSingle()
  return data
})

export const getProvince = cache(async (country: CountryCode, slug: string) => {
  const supabase = createPublicClient()
  const { data } = await supabase.from("provinces").select("id, name, slug").eq("country_code", country).eq("slug", slug).maybeSingle()
  return data
})

export interface NearbyPlace {
  kind: "city" | "neighborhood"
  name: string
  slug: string
  city_slug: string
  listings: number
}

export async function nearbyPlaces(scope: SearchScope, types: PropertyType[]) {
  const supabase = createPublicClient()
  const { data } = await supabase.rpc("nearby_places", {
    p_operation: scope.operation,
    p_types: types,
    p_country: scope.country,
    p_province_id: scope.provinceId,
    p_city_id: scope.cityId,
    p_neighborhood_id: scope.neighborhoodId,
    p_limit: 6,
  })
  return (data ?? []) as NearbyPlace[]
}

export const getNeighborhood = cache(async (cityId: number, slug: string) => {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from("neighborhoods")
    .select("id, name, slug")
    .eq("city_id", cityId)
    .eq("slug", slug)
    .maybeSingle()
  return data
})

export const getNeighborhoods = cache(async (cityId: number) => {
  const supabase = createPublicClient()
  const { data } = await supabase.from("neighborhoods").select("id, name, slug").eq("city_id", cityId).order("name")
  return data ?? []
})

export async function getCitiesBySlugs(country: CountryCode, slugs: string[]) {
  const supabase = createPublicClient()
  const { data } = await supabase.from("cities").select("name, slug").eq("country_code", country).in("slug", slugs)
  return slugs.map((s) => data?.find((c) => c.slug === s)).filter((c): c is { name: string; slug: string } => !!c)
}

export async function getTopCities(country: CountryCode, limit = 40) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from("cities")
    .select("name, slug")
    .eq("country_code", country)
    .order("population", { ascending: false })
    .limit(limit)
  return data ?? []
}

async function fetchListing(supabase: SupabaseClient<Database>, id: number) {
  const { data } = await supabase
    .from("listings")
    .select(
      `id, owner_id, status, operation, property_type, title, description, price, area_m2, bedrooms, bathrooms,
       floor, exterior, previous_price, year_built, energy_rating, features, country_code, published_at, updated_at, created_at, expires_at,
       rejection_reason, views_count,
       city:cities(id, name, slug, region, province:provinces(name, slug)),
       neighborhood:neighborhoods(id, name, slug),
       photos:listing_photos(id, storage_path, position, width, height, created_at)`,
    )
    .eq("id", id)
    .maybeSingle()
  if (!data) return null

  const location = await supabase.rpc("listing_public_point", { p_listing_id: id })
  const photos = [...(data.photos ?? [])].sort(
    (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
  )
  const point = (location.data as { lat: number; lng: number; exact: boolean }[] | null)?.[0] ?? null
  return { ...data, photos, point }
}

/** With the visitor's session: owners and admins also see their non-active listings (preview, edit). */
export const getListing = cache(async (id: number) => fetchListing(await createClient(), id))

/** Cookie-less, public listings only: safe for statically cached (ISR) pages. */
export const getPublicListing = cache(async (id: number) => fetchListing(createPublicClient(), id))

export type ListingDetail = NonNullable<Awaited<ReturnType<typeof getListing>>>

export async function getOwnerPublic(ownerId: string) {
  const supabase = createPublicClient()
  const { data } = await supabase.rpc("public_profile", { p_user_id: ownerId }).maybeSingle()
  return data
}

export async function similarListings(listing: ListingDetail, limit = 4) {
  if (!listing.city) return []
  const supabase = createPublicClient()
  const { data } = await supabase.rpc("search_listings", {
    p_operation: listing.operation,
    p_city_id: listing.city.id,
    p_types: [listing.property_type],
    p_price_min: Math.round(listing.price! * 0.6),
    p_price_max: Math.round(listing.price! * 1.5),
    p_limit: limit + 1,
  })
  const items = (data as unknown as { items: ListingSummary[] } | null)?.items ?? []
  return items.filter((i) => i.id !== listing.id).slice(0, limit)
}
