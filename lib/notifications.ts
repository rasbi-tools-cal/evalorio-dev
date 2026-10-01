import "server-only"
import { getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/routing"
import { emailButton, emailLayout, escapeHtml, sendEmail } from "@/lib/email"
import { COMPANY } from "@/lib/legal/company"
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
      html: emailLayout(`<p>"${escapeHtml(listing.label)}" was submitted and is waiting for review.</p>${emailButton(link, "Open moderation queue")}`),
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
       <blockquote style="margin:16px 0;padding:14px 16px;background:#f3f6f4;border-left:3px solid #006948;border-radius:8px;color:#0b1c30;white-space:pre-wrap">${escapeHtml(opts.body)}</blockquote>
       <p><strong>${escapeHtml(opts.senderName)}</strong> · ${escapeHtml(opts.senderEmail)}${opts.senderPhone ? ` · ${escapeHtml(opts.senderPhone)}` : ""}</p>
       <p style="color:#565e74">${escapeHtml(t("replyHint", { name: opts.senderName }))}</p>
       ${emailButton(link, t("openMessages"))}`,
    ),
  })
}

/** Approval, or a statement of reasons for a rejection / removal (DSA Art. 17). */
export async function notifyOwnerOfModeration(listingId: number, action: "approve" | "reject" | "remove", reason?: string | null) {
  const listing = await listingLabel(listingId)
  if (!listing) return
  const owner = await userContact(listing.owner_id)
  if (!owner.email) return
  const t = await getTranslations({ locale: owner.locale, namespace: "notifications" })
  const approved = action === "approve"
  const link = approved ? absoluteUrl(owner.locale, listingPath(listing.id, listing.title)) : absoluteUrl(owner.locale, "/account/listings")
  const paragraphs = approved
    ? [t("listingApprovedText", { listing: listing.label })]
    : [
        action === "remove"
          ? t("listingRemovedText", { listing: listing.label, reason: reason || "-" })
          : t("listingRejectedText", { listing: listing.label, reason: reason || "-" }),
        t("decisionByPerson"),
        t("howToAppeal", { email: COMPANY.supportEmail }),
      ]

  await sendEmail({
    to: owner.email,
    subject: approved ? t("listingApprovedSubject") : action === "remove" ? t("listingRemovedSubject") : t("listingRejectedSubject"),
    text: `${paragraphs.join("\n\n")}\n\n${link}`,
    html: emailLayout(`${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}${emailButton(link, approved ? t("viewListing") : t("openMyListings"))}`),
  })
}

/** Statement of reasons when an account is suspended (DSA Art. 17). */
export async function notifyUserOfSuspension(userId: string, reason?: string | null) {
  const user = await userContact(userId)
  if (!user.email) return
  const t = await getTranslations({ locale: user.locale, namespace: "notifications" })
  const paragraphs = [t("accountSuspendedText", { reason: reason || "-" }), t("decisionByPerson"), t("howToAppeal", { email: COMPANY.supportEmail })]
  await sendEmail({
    to: user.email,
    subject: t("accountSuspendedSubject"),
    text: paragraphs.join("\n\n"),
    html: emailLayout(paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")),
  })
}

/** Tells the person who reported a listing what we decided (DSA Art. 16(5)). */
export async function notifyReporterOfOutcome(reportId: string) {
  const { data: report } = await createAdminClient()
    .from("reports")
    .select("listing_id, reporter_email, locale, status")
    .eq("id", reportId)
    .single()
  if (!report?.reporter_email || (report.status !== "resolved" && report.status !== "dismissed")) return
  const t = await getTranslations({ locale: report.locale as Locale, namespace: "notifications" })
  const text = t(report.status === "resolved" ? "reportResolvedText" : "reportDismissedText", { listing: `#${report.listing_id}` })
  await sendEmail({
    to: report.reporter_email,
    subject: t("reportOutcomeSubject"),
    text,
    html: emailLayout(`<p>${escapeHtml(text)}</p>`),
  })
}
