import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env"

/** Anonymous, cookie-less client for public data, so pages using it can be statically cached. */
export function createPublicClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
