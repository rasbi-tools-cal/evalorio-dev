"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function unsubscribeAlert(token: string) {
  if (!/^[0-9a-f-]{36}$/.test(token)) return { ok: false as const }
  const { data } = await createAdminClient().from("saved_searches").update({ is_active: false }).eq("unsubscribe_token", token).select("id")
  return { ok: Boolean(data?.length) }
}
