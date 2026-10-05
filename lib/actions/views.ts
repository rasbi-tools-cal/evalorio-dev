"use server"

import { z } from "zod"
import { clientIp, hashIp, isLikelyBot, rateLimit } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "@/lib/supabase/server"

/**
 * Counts a listing view. Called from the browser once the page is shown, so the listing page itself
 * can be static (ISR) and crawlers that don't run JavaScript aren't counted. Owners viewing their own
 * listing are skipped.
 */
export async function recordListingView(listingId: number) {
  const id = z.number().int().positive().safeParse(listingId)
  if (!id.success || (await isLikelyBot())) return
  if (!(await rateLimit(`view:${hashIp(await clientIp())}`, 120, 3600))) return
  const admin = createAdminClient()
  const { data: listing } = await admin.from("listings").select("owner_id, status").eq("id", id.data).maybeSingle()
  if (!listing || listing.status !== "active") return
  const user = await getUser()
  if (user?.id === listing.owner_id) return
  await admin.rpc("increment_listing_views", { p_listing_id: id.data })
}
