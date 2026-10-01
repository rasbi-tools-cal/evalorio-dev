"use server"

import { z } from "zod"
import { createClient, getUser } from "@/lib/supabase/server"

const schema = z.object({ listingId: z.number().int().positive(), favorite: z.boolean() })

export async function setFavorite(input: { listingId: number; favorite: boolean }) {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "invalid" }
  const user = await getUser()
  if (!user) return { ok: false as const, error: "auth" }

  const supabase = await createClient()
  const { error } = parsed.data.favorite
    ? await supabase
        .from("favorites")
        .upsert({ user_id: user.id, listing_id: parsed.data.listingId }, { ignoreDuplicates: true })
    : await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", parsed.data.listingId)
  return error ? { ok: false as const, error: "failed" } : { ok: true as const }
}
