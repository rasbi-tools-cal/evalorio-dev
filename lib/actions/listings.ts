"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ENERGY_RATINGS, FEATURES, OPERATIONS, PROPERTY_TYPES } from "@/lib/catalog"
import { PHOTO_BUCKET } from "@/lib/env"
import { notifyAdminsOfPendingListing } from "@/lib/notifications"
import { rateLimit } from "@/lib/security"
import { createClient, getUser } from "@/lib/supabase/server"
import { containsContactInfo } from "@/lib/utils"

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; field?: string }

const id = z.number().int().positive()
const optionalInt = (min: number, max: number) => z.number().int().min(min).max(max).nullable().optional()

async function requireUser() {
  const user = await getUser()
  if (!user) throw new Error("auth")
  return user
}

function fail(error: string, field?: string) {
  return { ok: false as const, error, field }
}

function dbError(error: { message: string; code?: string } | null) {
  if (!error) return null
  const m = error.message.toLowerCase()
  if (m.includes("at least one photo")) return fail("photos")
  if (m.includes("can have at most")) return fail("photoLimit")
  if (m.includes("too far")) return fail("location", "location")
  if (m.includes("suspended")) return fail("banned")
  if (m.includes("listings_complete")) return fail("incomplete")
  console.error("listing action failed", error.code, error.message)
  return fail("generic")
}

// ---------------------------------------------------------------------------------------------
// Create / edit
// ---------------------------------------------------------------------------------------------

const basicsSchema = z.object({
  operation: z.enum(OPERATIONS),
  property_type: z.enum(PROPERTY_TYPES),
})

export async function createDraft(input: z.infer<typeof basicsSchema>): Promise<ActionResult<{ id: number }>> {
  const parsed = basicsSchema.safeParse(input)
  if (!parsed.success) return fail("invalid")
  const user = await requireUser()
  if (!(await rateLimit(`draft:${user.id}`, 15, 24 * 3600))) return fail("rate_limited")

  const supabase = await createClient()
  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .in("status", ["draft", "pending", "active", "paused"])
  // Private owners, not agencies: keep it reasonable (agencies come in a later stage).
  if ((count ?? 0) >= 25) return fail("too_many_listings")

  const { data, error } = await supabase.from("listings").insert(parsed.data).select("id").single()
  if (error || !data) return dbError(error) ?? fail("generic")
  return { ok: true, data: { id: data.id } }
}

const detailsSchema = z.object({
  operation: z.enum(OPERATIONS).optional(),
  property_type: z.enum(PROPERTY_TYPES).optional(),
  price: z.number().int().min(1).max(100_000_000).nullable().optional(),
  area_m2: z.number().int().min(1).max(100_000).nullable().optional(),
  bedrooms: optionalInt(0, 50),
  bathrooms: optionalInt(0, 50),
  floor: optionalInt(-5, 200),
  exterior: z.boolean().nullable().optional(),
  year_built: optionalInt(1500, 2100),
  energy_rating: z.enum(ENERGY_RATINGS).nullable().optional(),
  features: z.array(z.enum(FEATURES)).max(FEATURES.length).optional(),
  title: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
})

export async function saveDetails(
  listingId: number,
  input: z.infer<typeof detailsSchema>,
): Promise<ActionResult<{ status: string }>> {
  const parsed = detailsSchema.safeParse(input)
  if (!id.safeParse(listingId).success || !parsed.success) {
    return fail("invalid", parsed.error?.issues[0]?.path[0]?.toString())
  }
  await requireUser()
  const data = { ...parsed.data }
  if (data.title !== undefined) data.title = data.title ? data.title.replace(/\s+/g, " ") : null
  if (data.title && data.title.length < 5) return fail("title", "title")
  if (data.description !== undefined) data.description = data.description || null
  for (const field of ["title", "description"] as const) {
    if (data[field] && containsContactInfo(data[field]!)) return fail("noContactInText", field)
  }

  const supabase = await createClient()
  // The guard trigger may move a live listing back to "pending" (untrusted owner rewrote its text).
  const { data: row, error } = await supabase.from("listings").update(data).eq("id", listingId).select("status").single()
  if (error || !row) return dbError(error) ?? fail("not_found")
  revalidatePath("/[locale]", "layout")
  return { ok: true, data: { status: row.status } }
}

const locationSchema = z.object({
  cityId: id,
  neighborhoodId: id.nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().trim().max(200).nullable(),
  showExact: z.boolean(),
})

export async function saveLocation(listingId: number, input: z.infer<typeof locationSchema>): Promise<ActionResult> {
  const parsed = locationSchema.safeParse(input)
  if (!id.safeParse(listingId).success || !parsed.success) return fail("invalid")
  await requireUser()
  const supabase = await createClient()

  const { data: city } = await supabase.from("cities").select("id, country_code").eq("id", parsed.data.cityId).single()
  if (!city) return fail("city", "city")
  if (parsed.data.neighborhoodId) {
    const { data: hood } = await supabase
      .from("neighborhoods")
      .select("id")
      .eq("id", parsed.data.neighborhoodId)
      .eq("city_id", city.id)
      .maybeSingle()
    if (!hood) return fail("invalid", "neighborhood")
  }

  const { error } = await supabase
    .from("listings")
    .update({ city_id: city.id, country_code: city.country_code, neighborhood_id: parsed.data.neighborhoodId })
    .eq("id", listingId)
  if (error) return dbError(error)!

  // Not an upsert: PostgREST upserts also rewrite the key column, which owners may not update.
  const privateData = {
    location_exact: `SRID=4326;POINT(${parsed.data.lng} ${parsed.data.lat})`,
    address: parsed.data.address || null,
    show_exact_location: parsed.data.showExact,
  }
  const { data: existing } = await supabase.from("listing_private").select("listing_id").eq("listing_id", listingId).maybeSingle()
  const { error: privateError } = existing
    ? await supabase.from("listing_private").update(privateData).eq("listing_id", listingId)
    : await supabase.from("listing_private").insert({ listing_id: listingId, ...privateData })
  if (privateError) return dbError(privateError)!
  return { ok: true }
}

const contactSchema = z.object({
  contactName: z.string().trim().min(2).max(60),
  contactPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,20}$/)
    .nullable(),
  showPhone: z.boolean(),
})

export async function saveContact(listingId: number, input: z.infer<typeof contactSchema>): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input)
  if (!id.safeParse(listingId).success || !parsed.success) {
    return fail("invalid", parsed.error?.issues[0]?.path[0]?.toString())
  }
  await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listing_private")
    .update({
      contact_name: parsed.data.contactName,
      contact_phone: parsed.data.contactPhone || null,
      show_phone: parsed.data.showPhone && Boolean(parsed.data.contactPhone),
    })
    .eq("listing_id", listingId)
    .select("listing_id")
  if (error) return dbError(error)!
  if (!data?.length) return fail("location", "location")
  return { ok: true }
}

// ---------------------------------------------------------------------------------------------
// Photos (files are uploaded from the browser straight to Storage; RLS limits the folder)
// ---------------------------------------------------------------------------------------------

const photoSchema = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/\d+\/[0-9a-f-]{36}\.(webp|jpg|png)$/),
  width: z.number().int().min(1).max(10000),
  height: z.number().int().min(1).max(10000),
})

export async function addPhoto(listingId: number, input: z.infer<typeof photoSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = photoSchema.safeParse(input)
  if (!id.safeParse(listingId).success || !parsed.success) return fail("invalid")
  const user = await requireUser()
  if (!parsed.data.path.startsWith(`${user.id}/${listingId}/`)) return fail("invalid")

  const supabase = await createClient()
  const { count } = await supabase
    .from("listing_photos")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId)
  const { data, error } = await supabase
    .from("listing_photos")
    .insert({ listing_id: listingId, storage_path: parsed.data.path, width: parsed.data.width, height: parsed.data.height, position: Math.min(count ?? 0, 19) })
    .select("id")
    .single()
  if (error || !data) {
    await supabase.storage.from(PHOTO_BUCKET).remove([parsed.data.path])
    return dbError(error) ?? fail("generic")
  }
  return { ok: true, data: { id: data.id } }
}

export async function removePhoto(photoId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(photoId).success) return fail("invalid")
  await requireUser()
  const supabase = await createClient()
  const { data: photo } = await supabase.from("listing_photos").select("storage_path, listing_id").eq("id", photoId).single()
  if (!photo) return fail("not_found")
  const { error } = await supabase.from("listing_photos").delete().eq("id", photoId)
  if (error) return dbError(error)!
  await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path])
  await normalizePositions(photo.listing_id)
  return { ok: true }
}

export async function reorderPhotos(listingId: number, orderedIds: string[]): Promise<ActionResult> {
  if (!id.safeParse(listingId).success || !z.array(z.string().uuid()).max(20).safeParse(orderedIds).success) return fail("invalid")
  await requireUser()
  const supabase = await createClient()
  const results = await Promise.all(
    orderedIds.map((photoId, position) =>
      supabase.from("listing_photos").update({ position }).eq("id", photoId).eq("listing_id", listingId),
    ),
  )
  const failed = results.find((r) => r.error)
  return failed ? dbError(failed.error)! : { ok: true }
}

async function normalizePositions(listingId: number) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("listing_photos")
    .select("id")
    .eq("listing_id", listingId)
    .order("position")
    .order("created_at")
  await Promise.all((data ?? []).map((p, position) => supabase.from("listing_photos").update({ position }).eq("id", p.id)))
}

// ---------------------------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------------------------

export async function submitListing(listingId: number, input: { acceptTerms: boolean }): Promise<ActionResult<{ status: string }>> {
  if (!id.safeParse(listingId).success) return fail("invalid")
  if (input.acceptTerms !== true) return fail("terms", "terms")
  const user = await requireUser()
  if (!user.email_confirmed_at) return fail("email_unconfirmed")

  const supabase = await createClient()
  const { data: listing } = await supabase
    .from("listings")
    .select("status, price, area_m2, city_id, title, description")
    .eq("id", listingId)
    .single()
  if (!listing) return fail("not_found")
  if (!listing.price) return fail("price", "price")
  if (!listing.area_m2) return fail("area", "area_m2")
  if (!listing.city_id) return fail("city", "city")
  const { data: priv } = await supabase.from("listing_private").select("contact_name").eq("listing_id", listingId).maybeSingle()
  if (!priv) return fail("location", "location")
  if (!priv.contact_name) return fail("invalid", "contactName")

  if (!["draft", "rejected", "expired", "closed"].includes(listing.status)) {
    return { ok: true, data: { status: listing.status } }
  }
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "pending" })
    .eq("id", listingId)
    .select("status")
    .single()
  if (error || !data) return dbError(error) ?? fail("generic")

  if (data.status === "pending") await notifyAdminsOfPendingListing(listingId)
  revalidatePath("/[locale]", "layout")
  return { ok: true, data: { status: data.status } }
}

const ownerStatuses = z.enum(["paused", "active", "closed", "pending", "draft"])

export async function setListingStatus(listingId: number, status: z.infer<typeof ownerStatuses>): Promise<ActionResult> {
  if (!id.safeParse(listingId).success || !ownerStatuses.safeParse(status).success) return fail("invalid")
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from("listings").update({ status }).eq("id", listingId)
  if (error) return dbError(error)!
  revalidatePath("/[locale]", "layout")
  return { ok: true }
}

export async function renewListing(listingId: number): Promise<ActionResult> {
  if (!id.safeParse(listingId).success) return fail("invalid")
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.rpc("renew_listing", { p_listing_id: listingId })
  if (error) return dbError(error)!
  revalidatePath("/[locale]", "layout")
  return { ok: true }
}

export async function deleteListing(listingId: number): Promise<ActionResult> {
  if (!id.safeParse(listingId).success) return fail("invalid")
  const user = await requireUser()
  const supabase = await createClient()
  const { data: photos } = await supabase.from("listing_photos").select("storage_path").eq("listing_id", listingId)
  const { error } = await supabase.from("listings").delete().eq("id", listingId).eq("owner_id", user.id)
  if (error) return dbError(error)!
  if (photos?.length) await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.storage_path))
  revalidatePath("/[locale]", "layout")
  return { ok: true }
}
