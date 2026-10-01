"use server"

import { getLocale } from "next-intl/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { COUNTRY_CODES, CATEGORIES, OPERATIONS } from "@/lib/catalog"
import { createClient, getUser } from "@/lib/supabase/server"

const filtersSchema = z.object({
  country: z.enum(COUNTRY_CODES),
  provinceId: z.number().int().positive().optional(),
  cityId: z.number().int().positive().optional(),
  neighborhoodId: z.number().int().positive().optional(),
  category: z.enum(CATEGORIES),
  operation: z.enum(OPERATIONS),
  query: z.string().max(1000),
})

export async function saveSearch(input: { name: string; filters: z.infer<typeof filtersSchema> }) {
  const parsed = z.object({ name: z.string().trim().min(1).max(120), filters: filtersSchema }).safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "invalid" }
  const user = await getUser()
  if (!user) return { ok: false as const, error: "auth" }

  const query = new URLSearchParams(parsed.data.filters.query)
  query.delete("page")
  query.delete("view")
  const filters = { ...parsed.data.filters, query: query.toString() }

  const supabase = await createClient()
  const { error } = await supabase.from("saved_searches").insert({
    user_id: user.id,
    name: parsed.data.name,
    filters,
    locale: await getLocale(),
    frequency: "daily",
  })
  if (error) return { ok: false as const, error: error.message.includes("at most 20") ? "limit" : "failed" }
  revalidatePath("/[locale]/account/searches", "page")
  return { ok: true as const }
}

export async function updateSavedSearch(id: string, patch: { frequency?: "instant" | "daily" | "weekly"; is_active?: boolean }) {
  const parsed = z
    .object({ id: z.string().uuid(), frequency: z.enum(["instant", "daily", "weekly"]).optional(), is_active: z.boolean().optional() })
    .safeParse({ id, ...patch })
  if (!parsed.success) return { ok: false as const }
  const supabase = await createClient()
  const { id: searchId, ...data } = parsed.data
  const { error } = await supabase.from("saved_searches").update(data).eq("id", searchId)
  revalidatePath("/[locale]/account/searches", "page")
  return { ok: !error }
}

export async function deleteSavedSearch(id: string) {
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const }
  const supabase = await createClient()
  const { error } = await supabase.from("saved_searches").delete().eq("id", id)
  revalidatePath("/[locale]/account/searches", "page")
  return { ok: !error }
}
