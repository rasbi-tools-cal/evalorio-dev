"use server"

import { getFormatter, getLocale, getTranslations } from "next-intl/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Locale } from "@/i18n/routing"
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email"
import { clientIp, hashIp, rateLimit, verifyTurnstile } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient, getProfile, getUser } from "@/lib/supabase/server"
import { absoluteUrl } from "@/lib/urls"

const TYPES = ["access", "rectification", "erasure", "restriction", "portability", "objection", "withdraw_consent", "other"] as const

const requestSchema = z.object({
  type: z.enum(TYPES),
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(100).optional(),
  details: z.string().trim().max(3000).optional(),
  captchaToken: z.string().max(4096).optional(),
})

/** Data subject request (Arts. 15–22 GDPR): recorded with a reference and a one-month deadline. */
export async function submitPrivacyRequest(input: z.infer<typeof requestSchema>) {
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "invalid" as const }
  const rawIp = await clientIp()
  const ip = hashIp(rawIp)
  if (!(await verifyTurnstile(parsed.data.captchaToken, rawIp))) return { ok: false as const, error: "captcha" as const }
  if (!(await rateLimit(`privacy:${ip}`, 5, 86400))) return { ok: false as const, error: "rate_limited" as const }

  const locale = (await getLocale()) as Locale
  const user = await getUser()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("privacy_requests")
    .insert({
      type: parsed.data.type,
      email: parsed.data.email,
      name: parsed.data.name || null,
      details: parsed.data.details || null,
      locale,
      user_id: user?.id ?? null,
      ip_hash: ip,
    })
    .select("reference, due_at")
    .single()
  if (error || !data) return { ok: false as const, error: "generic" as const }

  const [t, format] = await Promise.all([getTranslations({ locale, namespace: "privacyRequest" }), getFormatter({ locale })])
  const date = format.dateTime(new Date(data.due_at), { dateStyle: "long" })
  const typeLabel = t(`types.${parsed.data.type}`)
  const text = t("emailText", { type: typeLabel, reference: data.reference, date })
  await sendEmail({
    to: parsed.data.email,
    subject: t("emailSubject", { reference: data.reference }),
    text,
    html: emailLayout(`<p>${escapeHtml(text)}</p>`),
  })

  // Tell the moderators: the one-month clock is running.
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin").eq("is_banned", false)
  for (const a of admins ?? []) {
    const { data: auth } = await admin.auth.admin.getUserById(a.id)
    if (!auth.user?.email) continue
    const link = absoluteUrl("en", "/admin/privacy")
    await sendEmail({
      to: auth.user.email,
      subject: `[Evalorio] Privacy request ${data.reference} (${parsed.data.type})`,
      text: `New privacy request ${data.reference} from ${parsed.data.email}, due ${data.due_at}. ${link}`,
      html: emailLayout(`<p>New privacy request <strong>${escapeHtml(data.reference)}</strong> (${escapeHtml(parsed.data.type)}) from ${escapeHtml(parsed.data.email)}.</p><p>Due: ${escapeHtml(date)}</p><p><a href="${escapeHtml(link)}">Open privacy requests</a></p>`),
    })
  }

  return { ok: true as const, reference: data.reference, dueAt: data.due_at, email: parsed.data.email }
}

const STATUSES = ["received", "verifying", "in_progress", "completed", "rejected"] as const

export async function updatePrivacyRequest(input: { id: string; status: (typeof STATUSES)[number]; note?: string }) {
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(STATUSES), note: z.string().trim().max(3000).optional() }).safeParse(input)
  if (!parsed.success) return { ok: false as const }
  const profile = await getProfile()
  if (profile?.role !== "admin") return { ok: false as const }
  const supabase = await createClient()
  const { error } = await supabase.rpc("update_privacy_request", { p_id: parsed.data.id, p_status: parsed.data.status, p_note: parsed.data.note })
  revalidatePath("/[locale]/admin/privacy", "page")
  return { ok: !error }
}
