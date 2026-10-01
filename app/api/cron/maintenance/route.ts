import { timingSafeEqual } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const maxDuration = 300

const UNCONFIRMED_DAYS = 7

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get("authorization") ?? ""
  if (!secret) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(header)
  return expected.length === given.length && timingSafeEqual(new Uint8Array(expected), new Uint8Array(given))
}

/**
 * Daily data minimisation (GDPR Art. 5(1)(c)/(e)): deletes accounts that never confirmed their email.
 * Table-level retention runs inside Postgres (pg_cron job "evalorio-gdpr-retention").
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const admin = createAdminClient()
  const cutoff = Date.now() - UNCONFIRMED_DAYS * 86_400_000
  let deleted = 0
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return NextResponse.json({ error: error.message, deleted }, { status: 500 })
    for (const u of data.users) {
      if (!u.email_confirmed_at && !u.phone_confirmed_at && new Date(u.created_at).getTime() < cutoff) {
        const { error: delError } = await admin.auth.admin.deleteUser(u.id)
        if (!delError) deleted++
      }
    }
    if (data.users.length < 1000) break
  }
  return NextResponse.json({ unconfirmedAccountsDeleted: deleted })
}
