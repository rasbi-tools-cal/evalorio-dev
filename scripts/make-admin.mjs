// Promote an existing account (it must have signed up first) to moderator.
// Usage: pnpm remote:make-admin you@example.com
import { createClient } from "@supabase/supabase-js"

const email = process.argv[2]?.trim().toLowerCase()
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY
if (!email || !url || !secret) {
  console.error("Usage: pnpm remote:make-admin you@example.com  (needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY)")
  process.exit(1)
}

const admin = createClient(url, secret, { auth: { persistSession: false } })

let user = null
for (let page = 1; !user; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) throw error
  user = data.users.find((u) => u.email?.toLowerCase() === email) ?? null
  if (data.users.length < 1000) break
}
if (!user) {
  console.error(`No account for ${email}. Sign up on the site first, confirm the email, then run this again.`)
  process.exit(1)
}

const { data: updated, error } = await admin.from("profiles").update({ role: "admin", is_trusted: true }).eq("id", user.id).select("id")
if (error) throw error
if (!updated?.length) {
  console.error(`${email} has no profile row, nothing was changed.`)
  process.exit(1)
}
console.log(`${email} is now an admin on ${url}`)
