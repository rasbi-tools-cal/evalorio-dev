import { ArrowRight, Bell, HandCoins, MessagesSquare } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ListingCard } from "@/components/listings/listing-card"
import { HeroSearch } from "@/components/search/hero-search"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from "@/lib/catalog"
import { SITE_URL } from "@/lib/env"
import { getCitiesBySlugs, latestListings } from "@/lib/listings/queries"
import { localizedAlternates, ogLocale } from "@/lib/seo"
import { absoluteUrl, searchPath } from "@/lib/urls"

export const revalidate = 60

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "meta" })
  return {
    title: { absolute: t("homeTitle") },
    description: t("homeDescription"),
    alternates: localizedAlternates(locale, () => "/"),
    openGraph: { title: t("homeTitle"), description: t("homeDescription"), url: absoluteUrl(locale, "/"), locale: ogLocale(locale) },
  }
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await pageLocale(params)
  const t = await getTranslations("home")
  const tc = await getTranslations("countries")
  const tcat = await getTranslations("categories")
  const tph = await getTranslations("operationPhrase")

  const [latest, ...featured] = await Promise.all([
    latestListings({ limit: 8 }),
    ...COUNTRY_CODES.map((code) => getCitiesBySlugs(code, COUNTRIES[code].featuredCities.slice(0, 6))),
  ])

  const values = [
    { icon: HandCoins, title: t("valueFreeTitle"), text: t("valueFreeText") },
    { icon: MessagesSquare, title: t("valueDirectTitle"), text: t("valueDirectText") },
    { icon: Bell, title: t("valueAlertsTitle"), text: t("valueAlertsText") },
  ]

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: "Evalorio",
              url: SITE_URL,
              logo: `${SITE_URL}/evalorio-logo.svg`,
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              url: absoluteUrl(locale, "/"),
              name: "Evalorio",
              inLanguage: locale,
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
          ],
        }}
      />

      <section className="bg-surface border-b">
        <div className="page-container pt-10 pb-12 sm:pt-16 sm:pb-16">
          <p className="text-primary mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
            <span className="bg-primary size-2 rounded-full" aria-hidden />
            {t("eyebrow")}
          </p>
          <h1 className="max-w-3xl text-4xl leading-[1.1] font-bold sm:text-5xl">{t("title")}</h1>
          <p className="text-subtle-foreground mt-4 max-w-2xl text-base sm:text-lg">{t("subtitle")}</p>
          <div className="mt-8 max-w-5xl">
            <HeroSearch />
          </div>
          <Link
            href="/post"
            className="text-primary mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            {t("ownerCta")} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="page-container py-12 sm:py-16" aria-labelledby="latest-heading">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id="latest-heading" className="text-2xl font-bold sm:text-3xl">
              {t("latestTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">{t("latestSubtitle")}</p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label={t("popularTitle")}>
            {COUNTRY_CODES.map((code) => (
              <Link
                key={code}
                href={searchPath(locale, { country: code, category: "homes", operation: "sale" })}
                className="hover:border-primary hover:text-primary rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
              >
                {tc(code)}
              </Link>
            ))}
          </nav>
        </div>
        {latest.length === 0 ? (
          <div className="bg-surface rounded-lg border border-dashed p-10 text-center">
            <p className="text-muted-foreground">{t("noListingsYet")}</p>
            <Button asChild className="mt-4">
              <Link href="/post">{t("ctaButton")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {latest.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} priority={i < 2} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface border-y" aria-label={t("valueFreeTitle")}>
        <div className="page-container grid gap-8 py-12 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="bg-primary-soft text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-container py-12 sm:py-16" aria-labelledby="popular-heading">
        <h2 id="popular-heading" className="mb-6 text-2xl font-bold">
          {t("popularTitle")}
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {COUNTRY_CODES.map((code, i) => (
            <div key={code}>
              <h3 className="mb-3 font-semibold">{tc(code)}</h3>
              <ul className="flex flex-col gap-1.5 text-sm">
                {featured[i].map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={searchPath(locale, { country: code as CountryCode, city: city.slug, category: "homes", operation: "sale" })}
                      className="text-subtle-foreground hover:text-primary"
                    >
                      {tcat("homes")} {tph("sale")} · {city.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="page-container pb-16">
        <div className="bg-primary text-primary-foreground flex flex-col items-start justify-between gap-6 rounded-xl p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-bold">{t("ctaTitle")}</h2>
            <p className="mt-1 opacity-90">{t("ctaText")}</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="bg-background text-foreground hover:bg-surface-low">
            <Link href="/post">{t("ctaButton")}</Link>
          </Button>
        </div>
      </section>
    </>
  )
}
