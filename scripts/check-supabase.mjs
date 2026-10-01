// Sanity check of a Supabase project (local or hosted) after migrations.
// Usage: pnpm remote:check                      (reads .env.remote.local)
//        node --env-file=.env.local scripts/check-supabase.mjs   (local)
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const secret = process.env.SUPABASE_SECRET_KEY
if (!url || !publishable || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY")
  process.exit(1)
}

const anon = createClient(url, publishable, { auth: { persistSession: false } })
const admin = createClient(url, secret, { auth: { persistSession: false } })
let failed = 0
const check = async (name, fn) => {
  try {
    const detail = await fn()
    console.log(`  ok  ${name}${detail ? ` — ${detail}` : ""}`)
  } catch (error) {
    failed++
    console.log(`FAIL  ${name} — ${error.message}`)
  }
}

console.log(`Checking ${url}\n`)

await check("reference data: 4 countries", async () => {
  const { count, error } = await anon.from("countries").select("*", { count: "exact", head: true })
  if (error) throw error
  if (count !== 4) throw new Error(`found ${count}`)
})
await check("reference data: cities imported", async () => {
  const { count, error } = await anon.from("cities").select("*", { count: "exact", head: true })
  if (error) throw error
  if (!count || count < 5000) throw new Error(`only ${count}`)
  return `${count} cities`
})
await check("city autocomplete RPC", async () => {
  const { data, error } = await anon.rpc("search_cities", { q: "Madr" })
  if (error) throw error
  if (!data?.some((c) => c.slug === "madrid")) throw new Error("Madrid not found")
})
await check("search RPC", async () => {
  const { data, error } = await anon.rpc("search_listings", { p_operation: "sale", p_limit: 1 })
  if (error) throw error
  return `${data.total} active listings`
})
await check("RLS: anon cannot read private listing data", async () => {
  const { error } = await anon.from("listing_private").select("*").limit(1)
  if (!error) throw new Error("anon could query listing_private")
})
await check("RLS: anon cannot read messages or reports", async () => {
  const a = await anon.from("messages").select("*").limit(1)
  const b = await anon.from("reports").select("*").limit(1)
  if (!a.error || !b.error) throw new Error("anon could query messages/reports")
})
await check("RLS: anon cannot call the rate limiter", async () => {
  const { error } = await anon.rpc("hit_rate_limit", { p_key: "check", p_limit: 1, p_window_seconds: 60 })
  if (!error) throw new Error("hit_rate_limit is callable by anon")
})
await check("old valuation schema is absent (no make_user_admin)", async () => {
  const { error } = await anon.rpc("make_user_admin", { user_email: "x@example.com" })
  if (!error || !/Could not find|not find the function|PGRST202/i.test(`${error.message} ${error.code}`)) {
    throw new Error("make_user_admin still exists — this is the old, vulnerable project")
  }
})
await check("storage bucket listing-photos (public, 10 MB, images only)", async () => {
  const { data, error } = await admin.storage.getBucket("listing-photos")
  if (error) throw error
  if (!data.public) throw new Error("bucket is not public")
  return `${Math.round((data.file_size_limit ?? 0) / 1048576)} MB, ${data.allowed_mime_types?.join(", ")}`
})
await check("at least one admin account", async () => {
  const { count, error } = await admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin")
  if (error) throw error
  if (!count) throw new Error("no admin yet — run: pnpm remote:make-admin you@example.com")
  return `${count} admin(s)`
})

console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed.")
process.exit(failed ? 1 : 0)
