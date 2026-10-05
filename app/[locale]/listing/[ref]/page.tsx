import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { permanentRedirect } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { getPublicListing } from "@/lib/listings/queries"
import { listingPath } from "@/lib/urls"
import { slugify } from "@/lib/utils"
import { ListingView, listingMetadata, listingTitle } from "./listing-view"

// ISR: each listing page is generated on its first visit and refreshed at most hourly. Edits,
// approvals and status changes revalidate it immediately (revalidatePath in the server actions).
export const revalidate = 3600

export function generateStaticParams() {
  return []
}

function parseRef(ref: string) {
  const match = /^(\d{1,12})(?:-([a-z0-9-]*))?$/.exec(ref)
  return match ? { id: Number(match[1]), slug: match[2] ?? "" } : null
}

/** Public, cookie-less data: only active listings. Owners preview others at /preview/listing/[id]. */
async function load(params: PageProps<"/[locale]/listing/[ref]">["params"]) {
  const locale = await pageLocale(params)
  const { ref } = await params
  const parsed = parseRef(ref)
  if (!parsed) notFound()
  const listing = await getPublicListing(parsed.id)
  if (!listing || listing.status !== "active" || !listing.city || !listing.price) notFound()
  return { locale, listing, slug: parsed.slug }
}

export async function generateMetadata({ params }: PageProps<"/[locale]/listing/[ref]">): Promise<Metadata> {
  const { locale, listing } = await load(params)
  return listingMetadata(listing, locale)
}

export default async function ListingPage({ params }: PageProps<"/[locale]/listing/[ref]">) {
  const { locale, listing, slug } = await load(params)
  const title = await listingTitle(listing, locale)
  if (slug !== slugify(title).slice(0, 80)) permanentRedirect({ href: listingPath(listing.id, title), locale })
  return <ListingView listing={listing} locale={locale} title={title} />
}
