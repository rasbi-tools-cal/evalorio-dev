import { createServerClient } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env"

/**
 * Refreshes the Supabase session cookies on the given response (the one produced by the i18n
 * proxy) and returns the verified user.
 */
export async function refreshSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
