import { ArrowLeft, Info } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getFormatter, getTranslations } from "next-intl/server"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"
import { blogPath, getPost, getTranslations as getPostTranslations, loadPostBody, type PostMeta } from "@/lib/blog/posts"
import { SITE_URL } from "@/lib/env"
import { ogLocale } from "@/lib/seo"
import { absoluteUrl } from "@/lib/urls"

async function loadPost(params: PageProps<"/[locale]/blog/[slug]">["params"]) {
  const locale = await pageLocale(params)
  const { slug } = await params
  const post = await getPost(locale, slug)
  if (!post) notFound()
  return { locale, post, translations: await getPostTranslations(post) }
}

/** hreflang only for the languages this article really exists in. */
function postAlternates(locale: Locale, post: PostMeta, translations: PostMeta[]): Metadata["alternates"] {
  const languages: Record<string, string> = Object.fromEntries(translations.map((p) => [p.locale, absoluteUrl(p.locale, blogPath(p.slug))]))
  const en = translations.find((p) => p.locale === "en")
  if (en) languages["x-default"] = absoluteUrl("en", blogPath(en.slug))
  return { canonical: absoluteUrl(locale, blogPath(post.slug)), languages }
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const { locale, post, translations } = await loadPost(params)
  const url = absoluteUrl(locale, blogPath(post.slug))
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: postAlternates(locale, post, translations),
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      locale: ogLocale(locale),
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
    },
    twitter: { card: "summary", title: post.title, description: post.description },
  }
}

export default async function BlogPostPage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, post, translations } = await loadPost(params)
  const [t, tc, format, Body] = await Promise.all([getTranslations("blog"), getTranslations("countries"), getFormatter(), loadPostBody(post)])
  const url = absoluteUrl(locale, blogPath(post.slug))
  const day = (d: string) => format.dateTime(new Date(`${d}T12:00:00Z`), { dateStyle: "long" })
  const others = translations.filter((p) => p.locale !== locale)

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      inLanguage: locale,
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      keywords: post.tags.join(", "),
      about: post.countries.map((c) => ({ "@type": "Country", name: tc(c) })),
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@type": "Organization", name: "Evalorio", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Evalorio", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/email/evalorio-logo.png` } },
      ...(post.sources.length ? { citation: post.sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })) } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Evalorio", item: absoluteUrl(locale, "/") },
        { "@type": "ListItem", position: 2, name: t("title"), item: absoluteUrl(locale, blogPath()) },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
    ...(post.faq.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]
      : []),
  ]

  return (
    <div className="page-container py-8 sm:py-12">
      <JsonLd data={jsonLd} />
      <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-primary">
              Evalorio
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={blogPath()} className="hover:text-primary">
              {t("title")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground line-clamp-1" aria-current="page">
            {post.title}
          </li>
        </ol>
      </nav>

      <article className="mx-auto mt-6 max-w-3xl">
        <header>
          <div className="flex flex-wrap gap-1.5">
            {post.countries.map((c) => (
              <Link key={c} href={`${blogPath()}?country=${c}`} className="bg-surface text-subtle-foreground hover:text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                {tc(c)}
              </Link>
            ))}
            {post.audience.map((a) => (
              <Link key={a} href={`${blogPath()}?audience=${a}`} className="bg-primary-soft text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                {t(`audience.${a}`)}
              </Link>
            ))}
          </div>
          <h1 className="mt-4 text-3xl leading-tight font-bold sm:text-4xl">{post.title}</h1>
          <p className="text-subtle-foreground mt-3 text-lg">{post.description}</p>
          <p className="text-muted-foreground mt-4 text-sm">
            <time dateTime={post.date}>{t("published", { date: day(post.date) })}</time>
            {post.updated && post.updated !== post.date && (
              <>
                {" · "}
                <time dateTime={post.updated}>{t("updated", { date: day(post.updated) })}</time>
              </>
            )}
            {" · "}
            {t("minutesRead", { minutes: post.readingMinutes })}
          </p>
          {others.length > 0 && (
            <p className="text-muted-foreground mt-2 text-sm">
              {t("otherLanguages")}:{" "}
              {others.map((p, i) => (
                <span key={p.locale}>
                  {i > 0 && ", "}
                  <Link href={blogPath(p.slug)} locale={p.locale} hrefLang={p.locale} className="text-primary font-medium hover:underline">
                    {t(`languages.${p.locale}`)}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </header>

        <div className="prose-evalorio mt-8 border-t pt-8">
          <Body />
        </div>

        {post.faq.length > 0 && (
          <section className="mt-12" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-2xl font-bold">
              {t("faqTitle")}
            </h2>
            <div className="mt-4 divide-y rounded-xl border">
              {post.faq.map((f) => (
                <details key={f.q} className="group p-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold">
                    {f.q}
                    <span className="text-primary mt-0.5 shrink-0 transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="text-subtle-foreground mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {post.sources.length > 0 && (
          <section className="mt-10" aria-labelledby="sources-heading">
            <h2 id="sources-heading" className="text-lg font-semibold">
              {t("sourcesTitle")}
            </h2>
            <ol className="text-subtle-foreground mt-3 list-decimal space-y-1.5 pl-5 text-sm">
              {post.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener noreferrer" target="_blank" className="text-primary font-medium hover:underline">
                    {s.title}
                  </a>{" "}
                  <span className="text-muted-foreground">({t("accessed", { date: day(s.accessed) })})</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <aside className="bg-surface mt-10 flex gap-3 rounded-xl border p-4 text-sm" aria-label={t("disclaimerTitle")}>
          <Info className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t("disclaimerTitle")}</p>
            <p className="text-subtle-foreground mt-1 leading-relaxed">{t("disclaimer")}</p>
          </div>
        </aside>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <Link href={blogPath()} className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
            <ArrowLeft className="size-4" aria-hidden /> {t("backToBlog")}
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/">{t("searchHomes")}</Link>
            </Button>
            <Button asChild>
              <Link href="/post">{t("listFree")}</Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}
