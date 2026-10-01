import "server-only"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/routing"
import { emailButton, emailLayout, escapeHtml, sendEmail } from "@/lib/email"
import { createAdminClient } from "@/lib/supabase/admin"
import { absoluteUrl, listingPath } from "@/lib/urls"

async function userContact(userId: string) {
  const admin = createAdminClient()
  const [{ data: auth }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select("locale, display_name").eq("id", userId).single(),
  ])
  return { email: auth.user?.email ?? null, locale: (profile?.locale ?? "en") as Locale, name: profile?.display_name ?? "" }
}

async function listingLabel(listingId: number) {
  const { data } = await createAdminClient().from("listings").select("id, title, owner_id").eq("id", listingId).single()
  return data ? { ...data, label: data.title || `#${data.id}` } : null
}

export async function notifyAdminsOfPendingListing(listingId: number) {
  const admin = createAdminClient()
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin").eq("is_banned", false)
  const listing = await listingLabel(listingId)
  if (!listing) return
  for (const a of admins ?? []) {
    const { email } = await userContact(a.id)
    if (!email) continue
    const link = absoluteUrl("en", "/admin")
    await sendEmail({
      to: email,
      subject: `[Evalorio] Listing #${listingId} waiting for review`,
      text: `"${listing.label}" was submitted and is waiting for review: ${link}`,
      html: emailLayout(`<p>"${escapeHtml(listing.label)}" was submitted and is waiting for review.</p><p>${emailButton(link, "Open moderation queue")}</p>`),
    })
  }
}

export async function notifyOwnerOfMessage(opts: {
  listingId: number
  senderName: string
  senderEmail: string
  senderPhone: string | null
  body: string
}) {
  const listing = await listingLabel(opts.listingId)
  if (!listing) return
  const owner = await userContact(listing.owner_id)
  if (!owner.email) return
  const t = await getTranslations({ locale: owner.locale, namespace: "notifications" })
  const link = absoluteUrl(owner.locale, "/account/messages")
  const phoneLine = opts.senderPhone ? `\n${opts.senderPhone}` : ""

  await sendEmail({
    to: owner.email,
    replyTo: opts.senderEmail,
    subject: t("newMessageSubject", { listing: listing.label }),
    text: `${t("newMessageIntro", { name: opts.senderName })}\n\n${opts.body}\n\n${opts.senderName} <${opts.senderEmail}>${phoneLine}\n\n${t("replyHint", { name: opts.senderName })}\n${link}`,
    html: emailLayout(
      `<p>${escapeHtml(t("newMessageIntro", { name: opts.senderName }))}</p>
       <blockquote style="margin:16px 0;padding:12px 16px;background:#eff4ff;border-radius:8px;white-space:pre-wrap">${escapeHtml(opts.body)}</blockquote>
       <p><strong>${escapeHtml(opts.senderName)}</strong> · ${escapeHtml(opts.senderEmail)}${opts.senderPhone ? ` · ${escapeHtml(opts.senderPhone)}` : ""}</p>
       <p style="color:#565e74">${escapeHtml(t("replyHint", { name: opts.senderName }))}</p>
       <p>${emailButton(link, "Evalorio")}</p>`,
    ),
  })
}

export async function notifyOwnerOfModeration(listingId: number, action: "approve" | "reject", reason?: string | null) {
  const listing = await listingLabel(listingId)
  if (!listing) return
  const owner = await userContact(listing.owner_id)
  if (!owner.email) return
  const t = await getTranslations({ locale: owner.locale, namespace: "notifications" })
  const approved = action === "approve"
  const link = approved ? absoluteUrl(owner.locale, listingPath(listing.id, listing.title)) : absoluteUrl(owner.locale, "/account/listings")
  const text = approved
    ? t("listingApprovedText", { listing: listing.label })
    : t("listingRejectedText", { listing: listing.label, reason: reason || "-" })

  await sendEmail({
    to: owner.email,
    subject: approved ? t("listingApprovedSubject") : t("listingRejectedSubject"),
    text: `${text}\n\n${link}`,
    html: emailLayout(`<p>${escapeHtml(text)}</p><p>${emailButton(link, "Evalorio")}</p>`),
  })
}
