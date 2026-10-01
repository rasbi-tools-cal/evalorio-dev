"use server"

import { getLocale } from "next-intl/server"
import { z } from "zod"
import { REPORT_REASONS } from "@/lib/catalog"
import { notifyOwnerOfMessage } from "@/lib/notifications"
import { clientIp, hashIp, rateLimit, verifyTurnstile } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "@/lib/supabase/server"

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: "invalid" | "rate_limited" | "captcha" | "not_found" | "own_listing" | "links" | "generic" }

const listingId = z.number().int().positive()

async function activeListing(id: number) {
  const { data } = await createAdminClient().from("listings").select("id, owner_id, status").eq("id", id).maybeSingle()
  return data && data.status === "active" ? data : null
}

/** Phone numbers are never in the page HTML; they are revealed on click, rate limited and logged. */
export async function revealPhone(id: number): Promise<Result<{ phone: string | null }>> {
  if (!listingId.safeParse(id).success) return { ok: false, error: "invalid" }
  const ip = hashIp(await clientIp())
  if (!(await rateLimit(`phone:${ip}`, 30, 3600)) || !(await rateLimit(`phone:${ip}:${id}`, 5, 86400))) {
    return { ok: false, error: "rate_limited" }
  }
  const listing = await activeListing(id)
  if (!listing) return { ok: false, error: "not_found" }

  const admin = createAdminClient()
  const { data: priv } = await admin.from("listing_private").select("contact_phone, show_phone").eq("listing_id", id).maybeSingle()
  const phone = priv?.show_phone ? priv.contact_phone : null
  if (phone) {
    const user = await getUser()
    await admin.from("phone_reveals").insert({ listing_id: id, viewer_id: user?.id ?? null, ip_hash: ip })
  }
  return { ok: true, phone }
}

const messageSchema = z.object({
  listingId,
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,20}$/)
    .or(z.literal(""))
    .optional(),
  body: z.string().trim().min(10).max(2000),
  captchaToken: z.string().max(4096).optional(),
  website: z.string().max(0).optional(), // honeypot: real users never fill it
})

export async function sendMessage(input: z.infer<typeof messageSchema>): Promise<Result> {
  const parsed = messageSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid" }
  const data = parsed.data
  const rawIp = await clientIp()
  const ip = hashIp(rawIp)

  if (!(await verifyTurnstile(data.captchaToken, rawIp))) return { ok: false, error: "captcha" }
  if (!(await rateLimit(`msg:ip:${ip}`, 10, 3600)) || !(await rateLimit(`msg:email:${data.email}`, 20, 86400))) {
    return { ok: false, error: "rate_limited" }
  }
  if (/(https?:\/\/|www\.)/i.test(data.body)) return { ok: false, error: "links" }

  const listing = await activeListing(data.listingId)
  if (!listing) return { ok: false, error: "not_found" }
  const user = await getUser()
  if (user?.id === listing.owner_id) return { ok: false, error: "own_listing" }

  const { error } = await createAdminClient().from("messages").insert({
    listing_id: listing.id,
    recipient_id: listing.owner_id,
    sender_id: user?.id ?? null,
    sender_name: data.name,
    sender_email: data.email,
    sender_phone: data.phone || null,
    body: data.body,
  })
  if (error) {
    console.error("message insert failed", error.message)
    return { ok: false, error: "generic" }
  }
  await notifyOwnerOfMessage({
    listingId: listing.id,
    senderName: data.name,
    senderEmail: data.email,
    senderPhone: data.phone || null,
    body: data.body,
  })
  return { ok: true }
}

const reportSchema = z.object({
  listingId,
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
  email: z.string().trim().toLowerCase().email().max(254).or(z.literal("")).optional(),
  captchaToken: z.string().max(4096).optional(),
})

export async function reportListing(input: z.infer<typeof reportSchema>): Promise<Result> {
  const parsed = reportSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid" }
  const rawIp = await clientIp()
  const ip = hashIp(rawIp)
  if (!(await verifyTurnstile(parsed.data.captchaToken, rawIp))) return { ok: false, error: "captcha" }
  if (!(await rateLimit(`report:${ip}`, 10, 86400))) return { ok: false, error: "rate_limited" }

  const listing = await activeListing(parsed.data.listingId)
  if (!listing) return { ok: false, error: "not_found" }
  const user = await getUser()
  const { error } = await createAdminClient().from("reports").insert({
    listing_id: listing.id,
    reporter_id: user?.id ?? null,
    reporter_email: parsed.data.email || user?.email || null,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
    ip_hash: ip,
    locale: await getLocale(),
  })
  return error ? { ok: false, error: "generic" } : { ok: true }
}
