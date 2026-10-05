import type { Metadata } from "next"
import Image from "next/image"
import { Suspense } from "react"
import { getFormatter, getTranslations } from "next-intl/server"
import { BlogList, BlogListFromUrl, type BlogListItem } from "@/components/blog/blog-list"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"
import { AUDIENCES, blogLocales, blogPath, getPosts } from "@/lib/blog/posts"
import { COUNTRY_CODES } from "@/lib/catalog"
import { absoluteUrl } from "@/lib/urls"

async function blogAlternates(locale: Locale): Promise<Metadata["alternates"]> {
  // hreflang only for languages that actually have articles.
  const locales = await blogLocales()
  const languages: Record<string, string> = Object.fromEntries(locales.map((l) => [l, absoluteUrl(l, blogPath())]))
  if (locales.includes("en")) languages["x-default"] = absoluteUrl("en", blogPath())
  return { canonical: absoluteUrl(locale, blogPath()), languages }
}

// Articles change only on deploy; regenerate at most once a day.
export const revalidate = 86400

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

export default async function BlogIndexPage({ params }: PageProps<"/[locale]/blog">) {
  const locale = await pageLocale(params)

  const [t, tc, tf, format, posts] = await Promise.all([
    getTranslations("blog"),
    getTranslations("countries"),
    getTranslations("footer"),
    getFormatter(),
    getPosts(locale),
  ])
  const listProps = {
    basePath: blogPath(),
    posts: posts.map((post): BlogListItem => ({
      slug: post.slug,
      href: blogPath(post.slug),
      title: post.title,
      description: post.description,
      date: format.dateTime(new Date(post.updated ?? post.date), { dateStyle: "medium" }),
      readingTime: t("minutesRead", { minutes: post.readingMinutes }),
      countries: post.countries,
      audience: post.audience,
      countryLabels: post.countries.map((c) => tc(c)),
      audienceLabels: post.audience.map((a) => t(`audience.${a}`)),
    })),
    countries: COUNTRY_CODES.map((c) => ({ value: c, label: tc(c) })),
    audiences: AUDIENCES.map((a) => ({ value: a, label: t(`audience.${a}`) })),
    labels: {
      filterCountry: t("filterCountry"),
      filterAudience: t("filterAudience"),
      allCountries: t("allCountries"),
      allAudiences: t("allAudiences"),
      noResults: t("noResults"),
      resetFilters: t("resetFilters"),
      readArticle: t("readArticle"),
    },
  }

  return (
    <>
      <section className="bg-surface relative isolate overflow-hidden border-b">
        {/* Positano, Amalfi Coast (Unsplash License), faded towards the text like the home hero. */}
        <Image src="/blog/amalfi-coast.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[center_45%]" />
        <div
          aria-hidden
          className="from-surface/90 via-surface/75 to-surface/40 md:from-surface md:via-surface/80 md:to-transparent absolute inset-0 -z-10 bg-linear-to-b md:bg-linear-to-r md:via-45%"
        />
        <div className="page-container py-2.5">
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
          <header className="mt-3 max-w-2xl">
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
          // Filters are applied in the browser (?country / ?audience), keeping this page static.
          <Suspense fallback={<BlogList {...listProps} />}>
            <BlogListFromUrl {...listProps} />
          </Suspense>
        )}
      </div>
    </>
  )
}
