// Replaces the photos of the DEMO owner's listings with 6–8 real property photos each.
// Local:  pnpm seed:photos          Hosted: pnpm remote:seed-photos
// Only touches listings of the demo account from supabase/seed.sql.
import { createClient } from "@supabase/supabase-js"
import { randomUUID } from "node:crypto"
import { downloadPhoto, photosFor } from "./demo-photos.mjs"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
if (!url || !key) throw new Error("Run with --env-file")
const DEMO_OWNER = "a0000000-0000-4000-8000-000000000002"
const BUCKET = "listing-photos"
const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: listings, error } = await supabase
  .from("listings")
  .select("id, property_type")
  .eq("owner_id", DEMO_OWNER)
  .order("id")
if (error) throw error
console.log(`${listings.length} demo listings on ${url}`)

for (const [i, l] of listings.entries()) {
  const { data: old } = await supabase.from("listing_photos").select("id, storage_path").eq("listing_id", l.id)
  const ids = photosFor(i, l.property_type)
  const rows = []
  for (const [position, photoId] of ids.entries()) {
    const path = `${DEMO_OWNER}/${l.id}/${randomUUID()}.jpg`
    const up = await supabase.storage.from(BUCKET).upload(path, await downloadPhoto(photoId), { contentType: "image/jpeg", cacheControl: "31536000" })
    if (up.error) throw new Error(`upload ${path}: ${up.error.message}`)
    rows.push({ listing_id: l.id, storage_path: path, position, width: 1600, height: 1067 })
  }
  // Remove the old rows first (max 20 photos per listing), then insert the new set.
  if (old?.length) {
    await supabase.from("listing_photos").delete().in("id", old.map((p) => p.id))
    await supabase.storage.from(BUCKET).remove(old.map((p) => p.storage_path))
  }
  const ins = await supabase.from("listing_photos").insert(rows)
  if (ins.error) throw new Error(`photos ${l.id}: ${ins.error.message}`)
  console.log(`listing ${l.id} (${l.property_type}): ${rows.length} photos`)
}
console.log("done")
