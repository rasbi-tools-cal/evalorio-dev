import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { safeNextPath } from "@/lib/urls"

const TYPES: EmailOtpType[] = ["signup", "email", "recovery", "email_change", "invite", "magiclink"]

/**
 * Email links (sign-up confirmation, password reset, email change) land here with a token hash.
 * Unlike the PKCE code flow this works even when the link is opened in another browser/device.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null

  // "next" may arrive as a full URL (the email template passes RedirectTo); keep only same-origin paths.
  let next = searchParams.get("next") ?? "/account/listings"
  try {
    const parsed = new URL(next, origin)
    if (parsed.origin !== origin) next = "/account/listings"
    else next = parsed.pathname + parsed.search
    // The redirect URL itself points back here; unwrap its own ?next=.
    if (parsed.pathname === "/api/auth/confirm") next = parsed.searchParams.get("next") ?? "/account/listings"
  } catch {
    next = "/account/listings"
  }
  next = safeNextPath(next, "/account/listings")

  const supabase = await createClient()
  if (tokenHash && type && TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }

  // Supabase's default email templates (projects without custom SMTP) go through /auth/v1/verify
  // and land here with a PKCE code instead. Works when opened in the browser that signed up.
  const code = searchParams.get("code")
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }
  return NextResponse.redirect(new URL("/login?error=callback", origin))
}
