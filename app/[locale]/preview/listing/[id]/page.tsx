import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { pageLocale } from "@/i18n/locale"
import { getListing } from "@/lib/listings/queries"
import { getProfile, getUser } from "@/lib/supabase/server"
import { ListingView, listingTitle } from "../../../listing/[ref]/listing-view"

export const metadata: Metadata = { robots: { index: false, follow: false } }

/**
 * Owner (or admin) preview of any listing, including drafts, pending and paused ones. Dynamic on
 * purpose: it reads the session. The public /listing page is static and only shows active listings.
 */
export default async function ListingPreviewPage({ params }: PageProps<"/[locale]/preview/listing/[id]">) {
  const locale = await pageLocale(params)
  const { id } = await params
  if (!/^\d{1,12}$/.test(id)) notFound()
  const [user, profile, listing] = await Promise.all([getUser(), getProfile(), getListing(Number(id))])
  if (!user || !listing || !listing.city) notFound()
  if (listing.owner_id !== user.id && profile?.role !== "admin") notFound()
  const title = await listingTitle(listing, locale)
  return <ListingView listing={listing} locale={locale} title={title} preview />
}
