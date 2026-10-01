import "server-only"
import type { CityOption } from "@/components/search/location-autocomplete"
import type { CountryCode, Operation, PropertyType } from "@/lib/catalog"
import type { WizardListing } from "@/lib/listings/wizard"
import { createClient, getProfile, getUser } from "@/lib/supabase/server"

/** Everything the owner can edit, including private data. Returns null if not the owner's listing. */
export async function loadListingForEdit(id: number) {
  const [user, profile] = await Promise.all([getUser(), getProfile()])
  if (!user || !profile || !Number.isInteger(id) || id <= 0) return null

  const supabase = await createClient()
  const { data: listing } = await supabase
    .from("listings")
    .select(
      `id, owner_id, status, operation, property_type, title, description, price, area_m2, bedrooms, bathrooms, floor,
       year_built, energy_rating, features, neighborhood_id, rejection_reason, city_id,
       photos:listing_photos(id, storage_path, position, created_at)`,
    )
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle()
  if (!listing || listing.status === "removed") return null

  const [{ data: priv }, { data: point }, { data: cityRows }] = await Promise.all([
    supabase
      .from("listing_private")
      .select("address, show_exact_location, contact_name, contact_phone, show_phone")
      .eq("listing_id", id)
      .maybeSingle(),
    supabase.rpc("listing_private_point", { p_listing_id: id }),
    listing.city_id ? supabase.rpc("get_city", { p_id: listing.city_id }) : Promise.resolve({ data: null }),
  ])

  const cityRow = cityRows?.[0]
  const city: CityOption | null = cityRow ? { ...cityRow, country_code: cityRow.country_code as CountryCode } : null
  const exact = point?.[0]

  const initial: WizardListing = {
    id: listing.id,
    ownerId: listing.owner_id,
    status: listing.status,
    operation: listing.operation as Operation,
    property_type: listing.property_type as PropertyType,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    area_m2: listing.area_m2,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    floor: listing.floor,
    year_built: listing.year_built,
    energy_rating: listing.energy_rating,
    features: listing.features,
    rejection_reason: listing.rejection_reason,
    city,
    neighborhoodId: listing.neighborhood_id,
    point: exact ? [exact.lat, exact.lng] : null,
    address: priv?.address ?? null,
    showExact: priv?.show_exact_location ?? false,
    contactName: priv?.contact_name ?? profile.display_name,
    contactPhone: priv?.contact_phone ?? profile.phone,
    showPhone: priv?.show_phone ?? true,
    photos: [...(listing.photos ?? [])]
      .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
      .map((p) => ({ id: p.id, storage_path: p.storage_path })),
  }

  return { initial, emailConfirmed: Boolean(user.email_confirmed_at), trusted: profile.is_trusted }
}

/** Statuses that are still being written: they use the step-by-step flow. */
export const DRAFT_STATUSES = ["draft", "rejected"]
