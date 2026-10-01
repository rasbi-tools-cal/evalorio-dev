import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { SUPABASE_URL } from "@/lib/env"

/**
 * Service-role client: bypasses RLS. Only for server code that has already validated the
 * request (captcha, rate limits, ownership). Never import from client components.
 */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set")

  return createClient<Database>(SUPABASE_URL, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
