import { after, NextResponse, type NextRequest } from "next/server"
import { notifyAdminsOfSignup } from "@/lib/notifications"
import { createClient } from "@/lib/supabase/server"
import { safeNextPath } from "@/lib/urls"

/** OAuth (Google) returns here with a PKCE code. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"), "/account/listings")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // First Google sign-in creates the account: alert the admins (account created < 2 min ago).
      const user = data.user
      if (user?.email && Date.now() - new Date(user.created_at).getTime() < 120_000) {
        const meta = user.user_metadata ?? {}
        after(() => notifyAdminsOfSignup({ email: user.email!, name: meta.full_name ?? meta.name, locale: meta.locale, method: "google" }))
      }
      return NextResponse.redirect(new URL(next, origin))
    }
  }
  return NextResponse.redirect(new URL("/login?error=callback", origin))
}
