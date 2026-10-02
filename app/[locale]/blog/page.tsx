import type { Metadata } from "next"
import Image from "next/image"
import { getFormatter, getTranslations } from "next-intl/server"
import { BlogPostCard } from "@/components/blog/post-card"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"
import { AUDIENCES, blogLocales, blogPath, getPosts, type Audience } from "@/lib/blog/posts"
import { COUNTRY_CODES, type CountryCode } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import { absoluteUrl } from "@/lib/urls"

async function blogAlternates(locale: Locale): Promise<Metadata["alternates"]> {
  // hreflang only for languages that actually have articles.
  const locales = await blogLocales()
  const languages: Record<string, string> = Object.fromEntries(locales.map((l) => [l, absoluteUrl(l, blogPath())]))
  if (locales.includes("en")) languages["x-default"] = absoluteUrl("en", blogPath())
  return { canonical: absoluteUrl(locale, blogPath()), languages }
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const [t, posts] = await Promise.all([getTranslations({ locale, namespace: "blog" }), getPosts(locale)])
  return {
    title: t("metaTitle"),
    description: t("description"),
    alternates: await blogAlternates(locale),
    // A language without articles shows an empty state: keep it out of the index.
    robots: posts.length ? undefined : { index: false, follow: true },
    openGraph: { title: t("metaTitle"), description: t("description"), url: absoluteUrl(locale, blogPath()), type: "website" },
  }
}

export default async function BlogIndexPage({ params, searchParams }: PageProps<"/[locale]/blog">) {
  const locale = await pageLocale(params)
  const { country: rawCountry, audience: rawAudience } = await searchParams
  const country = COUNTRY_CODES.includes(rawCountry as CountryCode) ? (rawCountry as CountryCode) : undefined
  const audience = AUDIENCES.includes(rawAudience as Audience) ? (rawAudience as Audience) : undefined

  const [t, tc, tf, format, posts] = await Promise.all([
    getTranslations("blog"),
    getTranslations("countries"),
    getTranslations("footer"),
    getFormatter(),
    getPosts(locale),
  ])
  const shown = posts.filter((p) => (!country || p.countries.includes(country)) && (!audience || p.audience.includes(audience)))
  const filterHref = (next: { country?: CountryCode; audience?: Audience }) => {
    const q = new URLSearchParams()
    if (next.country) q.set("country", next.country)
    if (next.audience) q.set("audience", next.audience)
    const s = q.toString()
    return s ? `${blogPath()}?${s}` : blogPath()
  }
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
      active ? "border-primary bg-primary-soft text-primary" : "bg-card hover:border-primary/40 text-foreground",
    )

  return (
    <>
      <section className="bg-surface relative isolate overflow-hidden border-b">
        {/* Positano, Amalfi Coast (Unsplash License), faded towards the text like the home hero. */}
        <Image src="/blog/amalfi-coast.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[center_45%]" />
        <div
          aria-hidden
          className="from-surface/90 via-surface/75 to-surface/40 md:from-surface md:via-surface/80 md:to-transparent absolute inset-0 -z-10 bg-linear-to-b md:bg-linear-to-r md:via-45%"
        />
        <div className="page-container py-10 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-primary">
                  Evalorio
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-foreground font-medium" aria-current="page">
                {t("title")}
              </li>
            </ol>
          </nav>
          <header className="mt-6 max-w-2xl">
            <p className="text-primary mb-3 flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <span className="bg-primary size-2 rounded-full" aria-hidden />
              {t("eyebrow")}
            </p>
            <h1 className="text-3xl font-bold sm:text-5xl">{t("title")}</h1>
            <p className="text-subtle-foreground mt-3 text-base sm:text-lg">{t("intro")}</p>
          </header>
        </div>
      </section>
      <div className="page-container py-8 sm:py-10">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Evalorio", item: absoluteUrl(locale, "/") },
              { "@type": "ListItem", position: 2, name: t("title"), item: absoluteUrl(locale, blogPath()) },
            ],
          }}
        />
        {posts.length === 0 ? (
          <section className="bg-surface rounded-2xl border p-8 text-center sm:p-12">
            <h2 className="text-xl font-semibold">{t("emptyTitle")}</h2>
            <p className="text-subtle-foreground mx-auto mt-2 max-w-xl">{t("emptyText")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/">{t("searchHomes")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/post">{tf("postListing")}</Link>
              </Button>
            </div>
          </section>
        ) : (
          <>
            <nav className="flex flex-col gap-3" aria-label={`${t("filterCountry")} / ${t("filterAudience")}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground w-16 text-sm">{t("filterCountry")}</span>
                <Link href={filterHref({ audience })} className={chip(!country)} aria-current={!country ? "page" : undefined}>
                  {t("allCountries")}
                </Link>
                {COUNTRY_CODES.map((c) => (
                  <Link key={c} href={filterHref({ country: c, audience })} className={chip(country === c)} aria-current={country === c ? "page" : undefined}>
                    {tc(c)}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground w-16 text-sm">{t("filterAudience")}</span>
                <Link href={filterHref({ country })} className={chip(!audience)} aria-current={!audience ? "page" : undefined}>
                  {t("allAudiences")}
                </Link>
                {AUDIENCES.map((a) => (
                  <Link key={a} href={filterHref({ country, audience: a })} className={chip(audience === a)} aria-current={audience === a ? "page" : undefined}>
                    {t(`audience.${a}`)}
                  </Link>
                ))}
              </div>
            </nav>

            {shown.length ? (
              <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((post) => (
                  <li key={post.slug}>
                    <BlogPostCard
                      href={blogPath(post.slug)}
                      title={post.title}
                      description={post.description}
                      date={format.dateTime(new Date(post.updated ?? post.date), { dateStyle: "medium" })}
                      readingTime={t("minutesRead", { minutes: post.readingMinutes })}
                      countries={post.countries.map((c) => tc(c))}
                      audience={post.audience.map((a) => t(`audience.${a}`))}
                      cta={t("readArticle")}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="bg-surface mt-8 rounded-2xl border p-8 text-center">
                <p className="text-subtle-foreground">{t("noResults")}</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={blogPath()}>{t("resetFilters")}</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
