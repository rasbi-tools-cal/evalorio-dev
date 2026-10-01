import "server-only"
import { getFormatter, getTranslations } from "next-intl/server"
import type { Locale } from "@/i18n/routing"
import { CATEGORY_TYPES, type Category, type CountryCode, type Operation } from "@/lib/catalog"
import { emailButton, emailLayout, escapeHtml, sendEmail } from "@/lib/email"
import type { ListingSummary } from "@/lib/listings/queries"
import { parseFilters, toRpcArgs, type SavedSearchFilters } from "@/lib/search/filters"
import { createAdminClient } from "@/lib/supabase/admin"
import { absoluteUrl, listingPath, searchPath } from "@/lib/urls"

const DUE_AFTER_MS: Record<"instant" | "daily" | "weekly", number> = {
  instant: 10 * 60 * 1000,
  daily: 23 * 60 * 60 * 1000,
  weekly: (7 * 24 - 1) * 60 * 60 * 1000,
}

/** Sends one email per saved search with listings published since the last run. Idempotent per window. */
export async function runAlerts(frequency: "instant" | "daily" | "weekly") {
  const admin = createAdminClient()
  const { data: searches, error } = await admin
    .from("saved_searches")
    .select("id, user_id, name, filters, locale, last_sent_at, created_at, unsubscribe_token")
    .eq("frequency", frequency)
    .eq("is_active", true)
    .limit(2000)
  if (error) throw error

  let sent = 0
  const now = Date.now()
  for (const s of searches ?? []) {
    const since = new Date(s.last_sent_at ?? s.created_at).getTime()
    if (now - since < DUE_AFTER_MS[frequency]) continue

    const f = s.filters as unknown as SavedSearchFilters
    const filters = parseFilters(Object.fromEntries(new URLSearchParams(f.query)))
    const args = toRpcArgs(filters, {
      operation: f.operation,
      country: f.country,
      cityId: f.cityId,
      neighborhoodId: f.neighborhoodId,
      types: CATEGORY_TYPES[f.category as Category] ?? CATEGORY_TYPES.homes,
    })
    const { data } = await admin.rpc("search_listings", { ...args, p_sort: "newest", p_limit: 20 })
    const fresh = ((data as unknown as { items: ListingSummary[] } | null)?.items ?? []).filter(
      (l) => new Date(l.published_at).getTime() > since,
    )

    // Mark the window as processed even when empty, so the next run looks only at newer listings.
    await admin.from("saved_searches").update({ last_sent_at: new Date(now).toISOString() }).eq("id", s.id)
    if (fresh.length === 0) continue

    const { data: auth } = await admin.auth.admin.getUserById(s.user_id)
    const email = auth.user?.email
    if (!email) continue

    const locale = s.locale as Locale
    const [t, tt, tph, format] = await Promise.all([
      getTranslations({ locale, namespace: "alerts" }),
      getTranslations({ locale, namespace: "types" }),
      getTranslations({ locale, namespace: "operationPhrase" }),
      getFormatter({ locale }),
    ])

    const cityRow = f.cityId ? (await admin.from("cities").select("slug").eq("id", f.cityId).single()).data : null
    const hoodRow = f.neighborhoodId ? (await admin.from("neighborhoods").select("slug").eq("id", f.neighborhoodId).single()).data : null
    const resultsUrl = absoluteUrl(
      locale,
      searchPath(locale, {
        country: f.country as CountryCode,
        city: cityRow?.slug,
        neighborhood: hoodRow?.slug,
        category: f.category as Category,
        operation: f.operation as Operation,
        query: f.query,
      }),
    )
    const unsubscribeUrl = absoluteUrl(locale, `/alerts/unsubscribe/${s.unsubscribe_token}`)
    const manageUrl = absoluteUrl(locale, "/account/searches")

    const rows = fresh.slice(0, 10).map((l) => {
      const title = l.title || `${tt(l.property_type)} ${tph(l.operation)} · ${l.city}`
      const price = format.number(l.price, "price")
      const url = absoluteUrl(locale, listingPath(l.id, title))
      return { title, price, url, place: [l.neighborhood, l.city].filter(Boolean).join(", "), area: l.area_m2 }
    })

    const html = emailLayout(
      `<p>${escapeHtml(t("intro", { name: s.name }))}</p>
       ${rows
         .map(
           (r) => `<p style="margin:0 0 14px"><a href="${escapeHtml(r.url)}" style="color:#006948;font-weight:600;text-decoration:none">${escapeHtml(r.title)}</a><br>
           <span style="color:#0b1c30;font-weight:700">${escapeHtml(r.price)}</span> · ${r.area} m² · <span style="color:#565e74">${escapeHtml(r.place)}</span></p>`,
         )
         .join("")}
       <p>${emailButton(resultsUrl, t("viewAll"))}</p>`,
      `<a href="${escapeHtml(manageUrl)}" style="color:#565e74">${escapeHtml(t("manage"))}</a> · <a href="${escapeHtml(unsubscribeUrl)}" style="color:#565e74">${escapeHtml(t("unsubscribe"))}</a>`,
    )
    const text = `${t("intro", { name: s.name })}\n\n${rows.map((r) => `${r.title} — ${r.price}\n${r.url}`).join("\n\n")}\n\n${t("viewAll")}: ${resultsUrl}\n${t("unsubscribe")}: ${unsubscribeUrl}`

    const ok = await sendEmail({
      to: email,
      subject: t("subject", { count: fresh.length, name: s.name }),
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${absoluteUrl("en", "/api/alerts/unsubscribe").replace(/\/$/, "")}?token=${s.unsubscribe_token}>, <${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    })
    if (ok) sent++
  }
  return { checked: searches?.length ?? 0, sent }
}
