import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ListingCard } from "@/components/listings/listing-card"
import { FiltersSheetButton, FiltersSidebar } from "@/components/search/filters-form"
import { Pagination } from "@/components/search/pagination"
import { SearchMapView } from "@/components/search/search-map-view"
import { ResultsHighlightProvider } from "@/components/search/results-highlight"
import { SaveSearchCard } from "@/components/search/save-search-card"
import { SaveSearchButton, SearchToolbar } from "@/components/search/search-toolbar"
import { SidebarMap } from "@/components/search/sidebar-map"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { Link, permanentRedirect } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"
import { categoriesFor, CATEGORY_TYPES, type CountryCode } from "@/lib/catalog"
import { getNeighborhoods, getTopCities, latestListings, searchListings } from "@/lib/listings/queries"
import { filtersToQuery, hasNarrowingFilters, PAGE_SIZE, parseFilters, MAX_PAGE } from "@/lib/search/filters"
import { resolveSearchContext, type SearchContext } from "@/lib/search/context"
import { localizedAlternates, ogLocale } from "@/lib/seo"
import { absoluteUrl, countryPath, searchPath } from "@/lib/urls"

type Props = PageProps<"/[locale]/[country]/[[...segments]]">
type Search = Extract<SearchContext, { kind: "search" }>

async function resolve(props: Props) {
  const locale = await pageLocale(props.params)
  const { country, segments = [] } = await props.params
  const ctx = await resolveSearchContext(locale, country, segments)
  if (ctx.kind === "notFound") notFound()
  if (ctx.kind === "redirect") permanentRedirect({ href: ctx.path, locale })
  return { locale, ctx: ctx as Exclude<SearchContext, { kind: "notFound" | "redirect" }> }
}

function pathFor(ctx: Search, l: Locale) {
  return searchPath(l, { country: ctx.country, city: ctx.city?.slug, neighborhood: ctx.neighborhood?.slug, category: ctx.category, operation: ctx.operation })
}

async function placeName(ctx: Search, locale: Locale) {
  const tc = await getTranslations({ locale, namespace: "countries" })
  if (ctx.neighborhood && ctx.city) return `${ctx.neighborhood.name}, ${ctx.city.name}`
  return ctx.city?.name ?? tc(ctx.country)
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, ctx } = await resolve(props)
  const tm = await getTranslations({ locale, namespace: "meta" })
  const tc = await getTranslations({ locale, namespace: "countries" })

  const tin = await getTranslations({ locale, namespace: "countriesIn" })
  if (ctx.kind === "country") {
    const inCountry = tin(ctx.country)
    return {
      title: tm("countryTitle", { inCountry }),
      description: tm("countryDescription", { inCountry }),
      alternates: localizedAlternates(locale, (l) => countryPath(l, ctx.country)),
      openGraph: { title: tm("countryTitle", { inCountry }), locale: ogLocale(locale), url: absoluteUrl(locale, countryPath(locale, ctx.country)) },
    }
  }

  const filters = parseFilters(await props.searchParams)
  const tcat = await getTranslations({ locale, namespace: "categories" })
  const tcatLower = await getTranslations({ locale, namespace: "categoriesLower" })
  const tph = await getTranslations({ locale, namespace: "operationPhrase" })
  const place = await placeName(ctx, locale)
  const { total } = await searchListings(
    { operation: ctx.operation, category: ctx.category, country: ctx.country, cityId: ctx.city?.id, neighborhoodId: ctx.neighborhood?.id },
    { ...filters, page: 1 },
  )
  const title = ctx.city
    ? tm("searchTitle", { category: tcat(ctx.category), operation: tph(ctx.operation), place })
    : tm("searchTitleCountry", { category: tcat(ctx.category), operation: tph(ctx.operation), inCountry: tin(ctx.country) })
  const pageSuffix = filters.page > 1 ? ` (${filters.page})` : ""
  const narrowed = hasNarrowingFilters(filters)

  return {
    title: title + pageSuffix,
    description: ctx.city
      ? tm("searchDescription", { count: total, category: tcatLower(ctx.category), operation: tph(ctx.operation), place })
      : tm("searchDescriptionCountry", { count: total, category: tcatLower(ctx.category), operation: tph(ctx.operation), inCountry: tin(ctx.country) }),
    // Filtered variants are useful for people, not for the index (thin/duplicate pages).
    robots: narrowed || total === 0 ? { index: false, follow: true } : undefined,
    alternates: localizedAlternates(locale, (l) => pathFor(ctx, l), !narrowed && filters.page > 1 ? `?page=${filters.page}` : ""),
    openGraph: { title, locale: ogLocale(locale), url: absoluteUrl(locale, pathFor(ctx, locale)) },
  }
}

export default async function SearchPage(props: Props) {
  const { locale, ctx } = await resolve(props)
  if (ctx.kind === "country") return <CountryLanding locale={locale} country={ctx.country} />

  const filters = parseFilters(await props.searchParams)
  const [t, tc, tcat, tph, tcountries, tin] = await Promise.all([
    getTranslations("search"),
    getTranslations("common"),
    getTranslations("categories"),
    getTranslations("operationPhrase"),
    getTranslations("countries"),
    getTranslations("countriesIn"),
  ])

  const scope = { operation: ctx.operation, category: ctx.category, country: ctx.country, cityId: ctx.city?.id, neighborhoodId: ctx.neighborhood?.id }
  const [{ total, items, markers }, neighborhoods] = await Promise.all([
    searchListings(scope, filters),
    ctx.city && !ctx.neighborhood ? getNeighborhoods(ctx.city.id) : Promise.resolve([]),
  ])
  const pages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGE)
  if (filters.page > 1 && filters.page > pages) notFound()

  const place = await placeName(ctx, locale)
  const basePath = pathFor(ctx, locale)
  const query = filtersToQuery(filters).toString()
  const heading = ctx.city
    ? t("h1", { category: tcat(ctx.category), operation: tph(ctx.operation), place })
    : t("h1Country", { category: tcat(ctx.category), operation: tph(ctx.operation), inCountry: tin(ctx.country) })
  const otherOperation = ctx.operation === "sale" ? "rent" : "sale"
  const otherCategory = ctx.category === "rooms" && otherOperation === "sale" ? "homes" : ctx.category
  const activeFilterCount = [filters.types, filters.priceMin, filters.priceMax, filters.bedrooms, filters.bathrooms, filters.areaMin, filters.areaMax, filters.features].filter(
    (v) => v != null,
  ).length

  const breadcrumbs = [
    { name: tc("home"), href: "/" },
    { name: tcountries(ctx.country), href: countryPath(locale, ctx.country) },
    ...(ctx.city ? [{ name: ctx.city.name, href: searchPath(locale, { country: ctx.country, city: ctx.city.slug, category: ctx.category, operation: ctx.operation }) }] : []),
    ...(ctx.neighborhood ? [{ name: ctx.neighborhood.name, href: basePath }] : []),
  ]

  const saveContext = {
    name: heading,
    country: ctx.country,
    cityId: ctx.city?.id,
    neighborhoodId: ctx.neighborhood?.id,
    category: ctx.category,
    operation: ctx.operation,
  }

  const results =
    items.length === 0 ? (
      <div className="bg-surface flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
        <h2 className="text-lg font-semibold">{t("noResultsTitle")}</h2>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">{t("noResultsText")}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {activeFilterCount > 0 && (
            <Button asChild variant="outline">
              <Link href={basePath}>{t("clearFilters")}</Link>
            </Button>
          )}
          <SaveSearchButton query={query} context={saveContext} />
        </div>
      </div>
    ) : (
      <>
        <ol className="flex flex-col gap-4">
          {items.map((listing, i) => (
            <li key={listing.id}>
              <ListingCard listing={listing} layout="horizontal" priority={i < 2} />
            </li>
          ))}
        </ol>
        <Pagination
          page={filters.page}
          pages={pages}
          hrefFor={(p) => {
            const q = filtersToQuery({ ...filters, page: p })
            return `${basePath}${q.size ? `?${q}` : ""}`
          }}
        />
      </>
    )

  return (
    <div className="page-container pb-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: absoluteUrl(locale, b.href) })),
        }}
      />
      <nav aria-label="Breadcrumb" className="text-muted-foreground py-4 text-[13px]">
        <ol className="flex flex-wrap items-center gap-1.5">
          {breadcrumbs.map((b, i) => (
            <li key={b.href} className="flex items-center gap-1.5">
              {i < breadcrumbs.length - 1 ? (
                <>
                  <Link href={b.href} className="hover:text-primary">
                    {b.name}
                  </Link>
                  <span aria-hidden>/</span>
                </>
              ) : (
                <span aria-current="page" className="text-foreground">
                  {b.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-3 border-b pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{heading}</h1>
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {t("resultsCount", { count: total })}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex gap-1" aria-label={tph("sale") + " / " + tph("rent")}>
            <span aria-current="page" className="border-primary text-primary border-b-2 px-3 py-1.5 text-sm font-semibold">
              {tcat(ctx.category)} {tph(ctx.operation)}
            </span>
            <Link
              href={searchPath(locale, { country: ctx.country, city: ctx.city?.slug, neighborhood: ctx.neighborhood?.slug, category: otherCategory, operation: otherOperation })}
              className="text-muted-foreground hover:text-foreground px-3 py-1.5 text-sm font-medium"
            >
              {tcat(otherCategory)} {tph(otherOperation)}
            </Link>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <FiltersSheetButton filters={filters} operation={ctx.operation} types={CATEGORY_TYPES[ctx.category]} total={total} activeCount={activeFilterCount} />
            <SearchToolbar sort={filters.sort} view={filters.view} query={query} saveContext={saveContext} />
          </div>
        </div>
        {filters.bbox && <p className="text-primary text-sm font-medium">{t("areaActive")}</p>}
      </div>

      <ResultsHighlightProvider>
      <div className="mt-6 flex gap-8">
        {filters.view === "list" && (
          <aside className="hidden w-72 shrink-0 flex-col gap-5 lg:flex" aria-label={t("filters")}>
            <SaveSearchCard query={query} context={saveContext} />
            <SidebarMap
              markers={items.map((i) => ({ id: i.id, price: i.price, lat: i.lat, lng: i.lng }))}
              center={ctx.center}
              zoom={ctx.zoom}
              mapHref={`${basePath}?${filtersToQuery({ ...filters, view: "map", page: 1 })}`}
            />
            <FiltersSidebar filters={filters} operation={ctx.operation} types={CATEGORY_TYPES[ctx.category]} total={total} />
          </aside>
        )}
        <div className="min-w-0 flex-1">
          {filters.view === "map" ? (
            <SearchMapView markers={markers} query={query} bbox={filters.bbox} center={ctx.center} zoom={ctx.zoom}>
              {results}
            </SearchMapView>
          ) : (
            <div className="flex flex-col gap-4">{results}</div>
          )}
        </div>
      </div>
      </ResultsHighlightProvider>

      <section className="mt-14 grid gap-10 border-t pt-10 md:grid-cols-2">
        {neighborhoods.length > 0 && ctx.city && (
          <div>
            <h2 className="mb-3 text-lg font-semibold">{t("neighbourhoods", { city: ctx.city.name })}</h2>
            <ul className="columns-2 gap-6 text-sm sm:columns-3">
              {neighborhoods.slice(0, 60).map((n) => (
                <li key={n.id} className="mb-1.5 break-inside-avoid">
                  <Link
                    href={searchPath(locale, { country: ctx.country, city: ctx.city!.slug, neighborhood: n.slug, category: ctx.category, operation: ctx.operation })}
                    className="text-subtle-foreground hover:text-primary"
                  >
                    {n.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h2 className="mb-3 text-lg font-semibold">{t("otherCategories", { place })}</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {(["sale", "rent"] as const).flatMap((op) =>
              categoriesFor(op)
                .filter((c) => !(c === ctx.category && op === ctx.operation))
                .map((c) => (
                  <li key={`${c}-${op}`}>
                    <Link
                      href={searchPath(locale, { country: ctx.country, city: ctx.city?.slug, neighborhood: ctx.neighborhood?.slug, category: c, operation: op })}
                      className="text-subtle-foreground hover:text-primary"
                    >
                      {tcat(c)} {tph(op)}
                    </Link>
                  </li>
                )),
            )}
          </ul>
        </div>
      </section>
    </div>
  )
}

async function CountryLanding({ locale, country }: { locale: Locale; country: CountryCode }) {
  const [t, tin, tcat, tph, cities, latest] = await Promise.all([
    getTranslations("search"),
    getTranslations("countriesIn"),
    getTranslations("categories"),
    getTranslations("operationPhrase"),
    getTopCities(country, 48),
    latestListings({ country, limit: 8 }),
  ])
  const inCountry = tin(country)

  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{t("countryH1", { inCountry })}</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["sale", "rent"] as const).flatMap((op) =>
          categoriesFor(op).slice(0, 4).map((c) => (
            <Link
              key={`${c}-${op}`}
              href={searchPath(locale, { country, category: c, operation: op })}
              className="hover:border-primary hover:text-primary rounded-full border px-4 py-2 text-sm font-medium"
            >
              {tcat(c)} {tph(op)}
            </Link>
          )),
        )}
      </div>

      {latest.length > 0 && (
        <section className="mt-12" aria-labelledby="latest-country">
          <h2 id="latest-country" className="mb-5 text-2xl font-bold">
            {t("latestIn", { inCountry })}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12" aria-labelledby="cities-heading">
        <h2 id="cities-heading" className="mb-5 text-2xl font-bold">
          {t("browseCities")}
        </h2>
        <ul className="columns-2 gap-8 text-sm sm:columns-3 lg:columns-4">
          {cities.map((c) => (
            <li key={c.slug} className="mb-2 break-inside-avoid">
              <Link href={searchPath(locale, { country, city: c.slug, category: "homes", operation: "sale" })} className="text-subtle-foreground hover:text-primary">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
