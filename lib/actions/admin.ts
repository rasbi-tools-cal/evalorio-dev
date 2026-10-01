"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { notifyOwnerOfModeration, notifyReporterOfOutcome, notifyUserOfSuspension } from "@/lib/notifications"
import { createClient, getProfile } from "@/lib/supabase/server"

async function requireAdmin() {
  const profile = await getProfile()
  if (profile?.role !== "admin" || profile.is_banned) throw new Error("forbidden")
}

export async function moderateListing(input: { listingId: number; action: "approve" | "reject" | "remove"; note?: string }) {
  const parsed = z
    .object({ listingId: z.number().int().positive(), action: z.enum(["approve", "reject", "remove"]), note: z.string().trim().max(500).optional() })
    .safeParse(input)
  if (!parsed.success) return { ok: false as const }
  if (parsed.data.action !== "approve" && !parsed.data.note) return { ok: false as const, error: "note" }
  await requireAdmin()
  const supabase = await createClient()
  // The SQL function re-checks admin rights and writes the moderation log.
  const { error } = await supabase.rpc("moderate_listing", {
    p_listing_id: parsed.data.listingId,
    p_action: parsed.data.action,
    p_note: parsed.data.note,
  })
  if (error) return { ok: false as const }
  await notifyOwnerOfModeration(parsed.data.listingId, parsed.data.action, parsed.data.note)
  revalidatePath("/[locale]", "layout")
  return { ok: true as const }
}

export async function setUserBanned(input: { userId: string; banned: boolean; note?: string }) {
  const parsed = z.object({ userId: z.string().uuid(), banned: z.boolean(), note: z.string().trim().max(500).optional() }).safeParse(input)
  if (!parsed.success) return { ok: false as const }
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc("set_user_banned", { p_user_id: parsed.data.userId, p_banned: parsed.data.banned, p_note: parsed.data.note })
  if (!error && parsed.data.banned) await notifyUserOfSuspension(parsed.data.userId, parsed.data.note)
  revalidatePath("/[locale]", "layout")
  return { ok: !error }
}

export async function resolveReport(input: { reportId: string; status: "resolved" | "dismissed" }) {
  const parsed = z.object({ reportId: z.string().uuid(), status: z.enum(["resolved", "dismissed"]) }).safeParse(input)
  if (!parsed.success) return { ok: false as const }
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc("resolve_report", { p_report_id: parsed.data.reportId, p_status: parsed.data.status })
  if (!error) await notifyReporterOfOutcome(parsed.data.reportId)
  revalidatePath("/[locale]/admin", "layout")
  return { ok: !error }
}
