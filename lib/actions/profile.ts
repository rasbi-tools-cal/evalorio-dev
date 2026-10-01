"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { locales } from "@/i18n/routing"
import { PHOTO_BUCKET } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient, getUser } from "@/lib/supabase/server"

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,20}$/)
    .or(z.literal("")),
  locale: z.enum(locales),
})

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, field: parsed.error.issues[0]?.path[0]?.toString() }
  const user = await getUser()
  if (!user) return { ok: false as const }
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName, phone: parsed.data.phone || null, locale: parsed.data.locale })
    .eq("id", user.id)
  if (!error) await supabase.auth.updateUser({ data: { display_name: parsed.data.displayName } })
  revalidatePath("/[locale]/account/settings", "page")
  return { ok: !error }
}

/** GDPR erasure: photos from Storage, then the auth user (cascades to every row we own). */
export async function deleteAccount(confirmation: string) {
  if (confirmation !== "DELETE") return { ok: false as const }
  const user = await getUser()
  if (!user) return { ok: false as const }
  const admin = createAdminClient()

  const { data: listings } = await admin.from("listings").select("id").eq("owner_id", user.id)
  for (const l of listings ?? []) {
    const folder = `${user.id}/${l.id}`
    const { data: files } = await admin.storage.from(PHOTO_BUCKET).list(folder, { limit: 100 })
    if (files?.length) await admin.storage.from(PHOTO_BUCKET).remove(files.map((f) => `${folder}/${f.name}`))
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error("account deletion failed", error.message)
    return { ok: false as const }
  }
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { ok: true as const }
}
