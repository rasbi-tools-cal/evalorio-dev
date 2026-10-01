import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/** GDPR data portability: everything we hold about the signed-in user, as JSON. */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const [profile, listings, favorites, searches, received, sent, consents, requests, reports] = await Promise.all([
    supabase.from("profiles").select("display_name, phone, locale, created_at").eq("id", user.id).single(),
    supabase.from("listings").select("*, private:listing_private(address, contact_name, contact_phone, show_phone), photos:listing_photos(storage_path, position)").eq("owner_id", user.id),
    supabase.from("favorites").select("listing_id, created_at"),
    supabase.from("saved_searches").select("name, filters, frequency, is_active, created_at"),
    supabase.from("messages").select("listing_id, sender_name, sender_email, sender_phone, body, created_at").eq("recipient_id", user.id),
    supabase.from("messages").select("listing_id, body, created_at").eq("sender_id", user.id),
    supabase.from("consent_records").select("consent_id, policy_version, categories, action, created_at").eq("user_id", user.id),
    supabase.from("privacy_requests").select("reference, type, status, email, details, created_at, resolved_at").eq("user_id", user.id),
    // Reports are admin-only under RLS; read the user's own ones with the service role.
    createAdminClient().from("reports").select("listing_id, reason, details, status, created_at").eq("reporter_id", user.id),
  ])

  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      account: { email: user.email, created_at: user.created_at },
      profile: profile.data,
      listings: (listings.data ?? []).map(({ search_vector: _sv, location: _loc, ...l }) => l),
      favorites: favorites.data,
      saved_searches: searches.data,
      messages_received: received.data,
      messages_sent: sent.data,
      cookie_consents: consents.data,
      privacy_requests: requests.data,
      reports_made: reports.data,
    },
    null,
    2,
  )
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="evalorio-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  })
}
