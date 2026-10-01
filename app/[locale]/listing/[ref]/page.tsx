import { Bath, BedDouble, Building2, CalendarDays, Check, Maximize } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { after } from "next/server"
import { getFormatter, getTranslations } from "next-intl/server"
import { ContactCard } from "@/components/listing/contact-card"
import { Gallery } from "@/components/listing/gallery"
import { ReportDialog, ShareButton } from "@/components/listing/listing-actions"
import { FavoriteButton } from "@/components/listings/favorite-button"
import { ListingCard } from "@/components/listings/listing-card"
import { ListingLocationMap } from "@/components/map"
import { JsonLd } from "@/components/seo/json-ld"
import { Link, permanentRedirect } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"
import { categoryForType, type CountryCode, type Operation, type PropertyType } from "@/lib/catalog"
import { photoUrl } from "@/lib/env"
import { displayTitle, pricePerSqm } from "@/lib/listings/display"
import { getListing, getOwnerPublic, similarListings, type ListingDetail } from "@/lib/listings/queries"
import { isLikelyBot } from "@/lib/security"
import { localizedAlternates, ogLocale } from "@/lib/seo"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "@/lib/supabase/server"
import { absoluteUrl, countryPath, listingPath, searchPath } from "@/lib/urls"
import { slugify } from "@/lib/utils"

function parseRef(ref: string) {
  const match = /^(\d{1,12})(?:-([a-z0-9-]*))?$/.exec(ref)
  return match ? { id: Number(match[1]), slug: match[2] ?? "" } : null
}

async function load(params: PageProps<"/[locale]/listing/[ref]">["params"]) {
  const locale = await pageLocale(params)
  const { ref } = await params
  const parsed = parseRef(ref)
  if (!parsed) notFound()
  const listing = await getListing(parsed.id)
  if (!listing || !listing.city || !listing.price) notFound()
  return { locale, listing, slug: parsed.slug }
}

async function titleFor(listing: ListingDetail, locale: Locale) {
  const [types, phrase] = await Promise.all([
    getTranslations({ locale, namespace: "types" }),
    getTranslations({ locale, namespace: "operationPhrase" }),
  ])
  return displayTitle(
    { title: listing.title, property_type: listing.property_type as PropertyType, operation: listing.operation as Operation, city: listing.city?.name },
    { types, phrase },
  )
}

export async function generateMetadata({ params }: PageProps<"/[locale]/listing/[ref]">): Promise<Metadata> {
  const { locale, listing } = await load(params)
  const title = await titleFor(listing, locale)
  const t = await getTranslations({ locale, namespace: "meta" })
  const types = await getTranslations({ locale, namespace: "types" })
  const phrase = await getTranslations({ locale, namespace: "operationPhrase" })
  const card = await getTranslations({ locale, namespace: "card" })
  const format = await getFormatter({ locale })
  const place = [listing.neighborhood?.name, listing.city?.name].filter(Boolean).join(", ")
  const details = [
    listing.bedrooms != null ? card("beds", { count: listing.bedrooms }) : null,
    listing.area_m2 ? `${listing.area_m2} m²` : null,
  ]
    .filter(Boolean)
    .join(", ")
  const description = t("listingDescription", {
    type: types(listing.property_type),
    operation: phrase(listing.operation),
    place,
    price: format.number(listing.price!, "price"),
    details: details ? ` · ${details}` : "",
  })
  const cover = listing.photos[0]

  return {
    title,
    description,
    alternates: localizedAlternates(locale, () => listingPath(listing.id, title)),
    robots: listing.status === "active" ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title,
      description,
      url: absoluteUrl(locale, listingPath(listing.id, title)),
      locale: ogLocale(locale),
      images: cover ? [{ url: photoUrl(cover.storage_path), width: cover.width ?? undefined, height: cover.height ?? undefined, alt: title }] : undefined,
    },
  }
}

export default async function ListingPage({ params, searchParams }: PageProps<"/[locale]/listing/[ref]">) {
  const { locale, listing, slug } = await load(params)
  const { photo } = await searchParams
  const initialPhoto = typeof photo === "string" && /^\d{1,2}$/.test(photo) ? Number(photo) : undefined
  const title = await titleFor(listing, locale)
  const expected = slugify(title).slice(0, 80)
  if (slug !== expected) permanentRedirect({ href: listingPath(listing.id, title), locale })

  const [t, tc, tt, tf, te, to, tcountries, tcat, tph, format, owner, similar, user] = await Promise.all([
    getTranslations("listing"),
    getTranslations("common"),
    getTranslations("types"),
    getTranslations("features"),
    getTranslations("energy"),
    getTranslations("operations"),
    getTranslations("countries"),
    getTranslations("categories"),
    getTranslations("operationPhrase"),
    getFormatter(),
    getOwnerPublic(listing.owner_id),
    listing.status === "active" ? similarListings(listing) : Promise.resolve([]),
    getUser(),
  ])

  const isOwner = user?.id === listing.owner_id
  const country = listing.country_code as CountryCode
  const operation = listing.operation as Operation
  const category = categoryForType(listing.property_type as PropertyType)
  const perSqm = pricePerSqm(listing.price, listing.area_m2)
  const place = [listing.neighborhood?.name, listing.city!.name].filter(Boolean).join(", ")

  // Contact name/phone availability comes from private data; only a boolean reaches the page.
  const { data: priv } = await createAdminClient()
    .from("listing_private")
    .select("contact_name, show_phone, contact_phone")
    .eq("listing_id", listing.id)
    .maybeSingle()
  const ownerName = priv?.contact_name || owner?.display_name || t("details")

  if (listing.status === "active" && !isOwner && !(await isLikelyBot())) {
    after(async () => {
      await createAdminClient().rpc("increment_listing_views", { p_listing_id: listing.id })
    })
  }

  const cityHref = searchPath(locale, { country, city: listing.city!.slug, category, operation })
  const hoodHref = listing.neighborhood
    ? searchPath(locale, { country, city: listing.city!.slug, neighborhood: listing.neighborhood.slug, category, operation })
    : null

  const facts = [
    listing.bedrooms != null && { icon: BedDouble, value: listing.bedrooms, label: t("bedrooms") },
    listing.bathrooms != null && { icon: Bath, value: listing.bathrooms, label: t("bathrooms") },
    { icon: Maximize, value: tc("sqm", { value: listing.area_m2! }), label: t("area") },
    listing.floor != null && { icon: Building2, value: listing.floor === 0 ? t("groundFloor") : listing.floor, label: t("floor") },
    listing.year_built && { icon: CalendarDays, value: listing.year_built, label: t("yearBuilt") },
  ].filter(Boolean) as { icon: typeof Bath; value: string | number; label: string }[]

  const url = absoluteUrl(locale, listingPath(listing.id, title))
  const breadcrumbs = [
    { name: tc("home"), href: "/" },
    { name: tcountries(country), href: countryPath(locale, country) },
    { name: listing.city!.name, href: cityHref },
    ...(hoodHref ? [{ name: listing.neighborhood!.name, href: hoodHref }] : []),
  ]

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: title,
      url,
      datePosted: listing.published_at ?? undefined,
      description: listing.description ?? undefined,
      image: listing.photos.slice(0, 10).map((p) => photoUrl(p.storage_path)),
      offers: {
        "@type": "Offer",
        price: listing.price,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        businessFunction: operation === "rent" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
      },
      about: {
        "@type": listing.property_type === "house" || listing.property_type === "villa" || listing.property_type === "country_house" ? "SingleFamilyResidence" : "Apartment",
        numberOfRooms: listing.bedrooms ?? undefined,
        numberOfBathroomsTotal: listing.bathrooms ?? undefined,
        floorSize: { "@type": "QuantitativeValue", value: listing.area_m2, unitCode: "MTK" },
        address: {
          "@type": "PostalAddress",
          addressLocality: listing.city!.name,
          addressRegion: listing.city!.region ?? undefined,
          addressCountry: country,
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: absoluteUrl(locale, b.href) })),
    },
  ]

  const tAccount = await getTranslations("account.status")
  const tCard = await getTranslations("card")
  const tContact = await getTranslations("contact")

  return (
    <div className="page-container pb-28 lg:pb-16">
      {listing.status === "active" && <JsonLd data={jsonLd} />}
      {listing.status === "active" && !isOwner && (
        <div className="bg-background/95 fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t px-4 py-3 backdrop-blur lg:hidden">
          <p className="font-heading text-lg font-bold">
            {format.number(listing.price!, "price")}
            {operation === "rent" && <span className="text-muted-foreground text-sm font-medium">{tc("perMonth")}</span>}
          </p>
          <a href="#contact" className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-11 items-center rounded-md px-5 text-sm font-semibold">
            {tContact("title")}
          </a>
        </div>
      )}

      {listing.status !== "active" && (
        <div role="status" className="bg-warning-soft text-warning mt-4 rounded-lg px-4 py-3 text-sm">
          {t("ownerPreview")} {t("statusBanner", { status: tAccount(listing.status as "draft") })}
        </div>
      )}

      <nav aria-label="Breadcrumb" className="text-muted-foreground py-4 text-[13px]">
        <ol className="flex flex-wrap items-center gap-1.5">
          {breadcrumbs.map((b) => (
            <li key={b.href} className="flex items-center gap-1.5">
              <Link href={b.href} className="hover:text-primary">
                {b.name}
              </Link>
              <span aria-hidden>/</span>
            </li>
          ))}
          <li aria-current="page" className="text-foreground">
            {t("ref", { id: listing.id })}
          </li>
        </ol>
      </nav>

      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="text-muted-foreground mb-1 text-sm">
            {tt(listing.property_type)} · {to(operation)} · {place}
          </p>
          <h1 className="text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">{title}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          {listing.status === "active" && <FavoriteButton listingId={listing.id} variant="button" />}
          <ShareButton title={title} />
        </div>
      </div>

      <Gallery photos={listing.photos.map((p) => p.storage_path)} title={title} initialPhoto={initialPhoto} />

      <div className="bg-surface my-6 flex flex-col gap-5 rounded-xl border p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-heading text-primary text-3xl font-bold sm:text-4xl">
            {format.number(listing.price!, "price")}
            {operation === "rent" && <span className="text-muted-foreground text-lg font-medium">{tc("perMonth")}</span>}
          </p>
          {listing.previous_price && listing.previous_price > listing.price! && (
            <p className="text-destructive text-sm font-semibold">
              <span className="text-muted-foreground mr-2 font-normal line-through">{format.number(listing.previous_price, "price")}</span>
              {tCard("priceDrop", { amount: format.number(listing.previous_price - listing.price!, "price") })}
            </p>
          )}
          {perSqm && operation === "sale" && (
            <p className="text-muted-foreground text-sm">{tc("pricePerSqm", { value: format.number(perSqm, "price") })}</p>
          )}
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-4">
          {facts.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <Icon className="text-primary size-5" aria-hidden />
              <div>
                <dd className="font-heading leading-none font-semibold">{value}</dd>
                <dt className="text-muted-foreground mt-1 text-xs">{label}</dt>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-10 lg:col-span-8">
          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="mb-3 text-xl font-bold">
              {t("description")}
            </h2>
            {listing.description ? (
              <div className="text-subtle-foreground leading-relaxed whitespace-pre-line">{listing.description}</div>
            ) : (
              <p className="text-muted-foreground">{t("noDescription")}</p>
            )}
          </section>

          {listing.features.length > 0 && (
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className="mb-3 text-xl font-bold">
                {t("features")}
              </h2>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
                {listing.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="text-primary size-4" aria-hidden />
                    {tf(f)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="details-heading">
            <h2 id="details-heading" className="mb-3 text-xl font-bold">
              {t("details")}
            </h2>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {[
                [t("propertyType"), tt(listing.property_type)],
                [t("operation"), to(operation)],
                [t("area"), tc("sqm", { value: listing.area_m2! })],
                listing.exterior != null ? [t("orientation"), listing.exterior ? tCard("exterior") : tCard("interior")] : null,
                perSqm && operation === "sale" ? [t("pricePerSqm"), format.number(perSqm, "price")] : null,
                listing.energy_rating
                  ? [te("label"), listing.energy_rating === "exempt" ? te("exempt") : listing.energy_rating === "pending" ? te("pending") : listing.energy_rating]
                  : null,
                listing.published_at ? [t("publishedLabel"), format.dateTime(new Date(listing.published_at), { dateStyle: "medium" })] : null,
                [t("refLabel"), String(listing.id)],
              ]
                .filter((row): row is string[] => Boolean(row))
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b py-2.5 text-sm">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
            </dl>
          </section>

          {listing.point && (
            <section aria-labelledby="location-heading">
              <h2 id="location-heading" className="mb-1 text-xl font-bold">
                {t("location")}
              </h2>
              <p className="text-muted-foreground mb-3 text-sm">
                {place}, {tcountries(country)} · {listing.point.exact ? t("exactLocation") : t("approximateLocation")}
              </p>
              <ListingLocationMap lat={listing.point.lat} lng={listing.point.lng} exact={listing.point.exact} label={`${t("location")}: ${place}`} />
            </section>
          )}

          {listing.status === "active" && !isOwner && (
            <div>
              <ReportDialog listingId={listing.id} />
            </div>
          )}
        </div>

        <aside id="contact" className="scroll-mt-20 lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            {listing.status === "active" || isOwner ? (
              <ContactCard
                listingId={listing.id}
                ownerId={listing.owner_id}
                ownerName={ownerName}
                memberSince={owner?.created_at ?? null}
                hasPhone={Boolean(priv?.show_phone && priv.contact_phone)}
              />
            ) : null}
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16" aria-labelledby="similar-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="similar-heading" className="text-2xl font-bold">
              {t("similar")}
            </h2>
            <Link href={cityHref} className="text-primary text-sm font-semibold hover:underline">
              {tcat(category)} {tph(operation)} · {listing.city!.name} →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((s) => (
              <ListingCard key={s.id} listing={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
