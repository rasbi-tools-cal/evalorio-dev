// Copies users (same ids + password hashes), profiles, listings (same ids), private data, photos
// and engagement rows from the LOCAL Supabase (Docker) to the hosted project in .env.remote.local.
// Usage: pnpm remote:migrate-local   (target must be empty of listings)
import { createClient } from "@supabase/supabase-js"
import { execFileSync } from "node:child_process"

const LOCAL_URL = "http://127.0.0.1:54321"
const LOCAL_SECRET = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz" // well-known local dev key
const remoteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const remoteSecret = process.env.SUPABASE_SECRET_KEY
if (!remoteUrl?.startsWith("https://") || !remoteSecret) throw new Error("Run with --env-file=.env.remote.local")

const local = createClient(LOCAL_URL, LOCAL_SECRET, { auth: { persistSession: false } })
const remote = createClient(remoteUrl, remoteSecret, { auth: { persistSession: false } })
const BUCKET = "listing-photos"

function localSql(sql) {
  const out = execFileSync("docker", ["exec", "-i", "supabase_db_evalorio-dev", "psql", "-U", "postgres", "-d", "postgres", "-At", "-c", sql], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
  return JSON.parse(out.trim() || "[]")
}
const must = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}

const { count: remoteListings } = await remote.from("listings").select("id", { count: "exact", head: true })
if (remoteListings) throw new Error(`Target already has ${remoteListings} listings; refusing to merge.`)

// 1. Users (auth schema is not exposed over the API, read it straight from the local container).
const users = localSql(`select coalesce(json_agg(u order by u.created_at), '[]') from (
  select u.id, u.email, u.encrypted_password, u.raw_user_meta_data, u.email_confirmed_at, u.created_at,
         p.display_name, p.phone, p.locale, p.role, p.is_trusted, p.is_banned
  from auth.users u join public.profiles p on p.id = u.id) u`)
for (const u of users) {
  const { data: existing } = await remote.auth.admin.getUserById(u.id)
  if (existing?.user) {
    console.log(`user exists: ${u.email}`)
  } else {
    must(
      await remote.auth.admin.createUser({
        id: u.id,
        email: u.email,
        password_hash: u.encrypted_password,
        email_confirm: Boolean(u.email_confirmed_at),
        user_metadata: u.raw_user_meta_data ?? {},
      }),
      `create ${u.email}`,
    )
    console.log(`user created: ${u.email}`)
  }
  must(
    await remote
      .from("profiles")
      .update({ display_name: u.display_name, phone: u.phone, locale: u.locale, role: u.role, is_trusted: u.is_trusted, is_banned: u.is_banned })
      .eq("id", u.id),
    `profile ${u.email}`,
  )
}

// 2. Listings in id order: the target's identity sequence is fresh, so ids (and URLs) stay the same.
const listings = localSql(`select coalesce(json_agg(l order by l.id), '[]') from (
  select l.*, extensions.st_asewkt(p.location_exact::extensions.geometry) as exact_ewkt,
         p.address, p.show_exact_location, p.contact_name, p.contact_phone, p.show_phone
  from public.listings l left join public.listing_private p on p.listing_id = l.id) l`)
for (const l of listings) {
  const row = must(
    await remote
      .from("listings")
      .insert({
        owner_id: l.owner_id,
        status: "draft",
        operation: l.operation,
        property_type: l.property_type,
        title: l.title,
        description: l.description,
        price: l.price,
        area_m2: l.area_m2,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        floor: l.floor,
        exterior: l.exterior,
        year_built: l.year_built,
        energy_rating: l.energy_rating,
        features: l.features,
        country_code: l.country_code,
        city_id: l.city_id,
        neighborhood_id: l.neighborhood_id,
        created_at: l.created_at,
      })
      .select("id")
      .single(),
    `listing ${l.id}`,
  )
  if (row.id !== l.id) throw new Error(`id drift: local ${l.id} -> remote ${row.id}`)

  if (l.exact_ewkt) {
    must(
      await remote.from("listing_private").insert({
        listing_id: l.id,
        location_exact: l.exact_ewkt,
        address: l.address,
        show_exact_location: l.show_exact_location,
        contact_name: l.contact_name,
        contact_phone: l.contact_phone,
        show_phone: l.show_phone,
      }),
      `private ${l.id}`,
    )
  }

  const photos = must(await local.from("listing_photos").select("*").eq("listing_id", l.id).order("position"), `photos ${l.id}`)
  for (const p of photos) {
    const file = must(await local.storage.from(BUCKET).download(p.storage_path), `download ${p.storage_path}`)
    const up = await remote.storage.from(BUCKET).upload(p.storage_path, file, { contentType: file.type, upsert: true, cacheControl: "31536000" })
    if (up.error) throw new Error(`upload ${p.storage_path}: ${up.error.message}`)
    must(
      await remote.from("listing_photos").insert({ listing_id: l.id, storage_path: p.storage_path, position: p.position, width: p.width, height: p.height }),
      `photo row ${p.storage_path}`,
    )
  }

  must(
    await remote
      .from("listings")
      .update({ status: l.status, published_at: l.published_at, expires_at: l.expires_at, views_count: l.views_count, rejection_reason: l.rejection_reason, previous_price: l.previous_price })
      .eq("id", l.id),
    `status ${l.id}`,
  )
  console.log(`listing ${l.id} (${l.status}) + ${photos.length} photos`)
}

// 3. Engagement tables (copied as-is when present).
for (const table of ["favorites", "saved_searches", "messages", "reports"]) {
  const rows = must(await local.from(table).select("*"), table)
  if (rows.length) must(await remote.from(table).insert(rows), `insert ${table}`)
  console.log(`${table}: ${rows.length}`)
}

console.log(`\nDone: ${users.length} users, ${listings.length} listings copied to ${remoteUrl}`)
