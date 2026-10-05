"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { BlogPostCard } from "./post-card"

export interface BlogListItem {
  slug: string
  href: string
  title: string
  description: string
  date: string
  readingTime: string
  countries: string[]
  audience: string[]
  countryLabels: string[]
  audienceLabels: string[]
}

interface Labels {
  filterCountry: string
  filterAudience: string
  allCountries: string
  allAudiences: string
  noResults: string
  resetFilters: string
  readArticle: string
}

type Option = { value: string; label: string }

/**
 * Article list with country / audience filters. Filters live in the URL (?country=ES&audience=buyers)
 * but are applied in the browser, so /blog stays a static page. `filtered={false}` renders the full
 * list (the prerendered HTML, used as the Suspense fallback).
 */
export function BlogList(props: { posts: BlogListItem[]; countries: Option[]; audiences: Option[]; labels: Labels; basePath: string }) {
  return <BlogListView {...props} country={undefined} audience={undefined} />
}

export function BlogListFromUrl(props: { posts: BlogListItem[]; countries: Option[]; audiences: Option[]; labels: Labels; basePath: string }) {
  const params = useSearchParams()
  const country = props.countries.some((c) => c.value === params.get("country")) ? params.get("country")! : undefined
  const audience = props.audiences.some((a) => a.value === params.get("audience")) ? params.get("audience")! : undefined
  return <BlogListView {...props} country={country} audience={audience} />
}

function BlogListView({
  posts,
  countries,
  audiences,
  labels,
  basePath,
  country,
  audience,
}: {
  posts: BlogListItem[]
  countries: Option[]
  audiences: Option[]
  labels: Labels
  basePath: string
  country?: string
  audience?: string
}) {
  const shown = posts.filter((p) => (!country || p.countries.includes(country)) && (!audience || p.audience.includes(audience)))
  const href = (next: { country?: string; audience?: string }) => {
    const q = new URLSearchParams()
    if (next.country) q.set("country", next.country)
    if (next.audience) q.set("audience", next.audience)
    const s = q.toString()
    return s ? `${basePath}?${s}` : basePath
  }
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
      active ? "border-primary bg-primary-soft text-primary" : "bg-card hover:border-primary/40 text-foreground",
    )

  return (
    <>
      <nav className="flex flex-col gap-3" aria-label={`${labels.filterCountry} / ${labels.filterAudience}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-16 text-sm">{labels.filterCountry}</span>
          <Link href={href({ audience })} scroll={false} className={chip(!country)} aria-current={!country ? "page" : undefined}>
            {labels.allCountries}
          </Link>
          {countries.map((c) => (
            <Link key={c.value} href={href({ country: c.value, audience })} scroll={false} className={chip(country === c.value)} aria-current={country === c.value ? "page" : undefined}>
              {c.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-16 text-sm">{labels.filterAudience}</span>
          <Link href={href({ country })} scroll={false} className={chip(!audience)} aria-current={!audience ? "page" : undefined}>
            {labels.allAudiences}
          </Link>
          {audiences.map((a) => (
            <Link key={a.value} href={href({ country, audience: a.value })} scroll={false} className={chip(audience === a.value)} aria-current={audience === a.value ? "page" : undefined}>
              {a.label}
            </Link>
          ))}
        </div>
      </nav>

      {shown.length ? (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((post) => (
            <li key={post.slug}>
              <BlogPostCard
                href={post.href}
                title={post.title}
                description={post.description}
                date={post.date}
                readingTime={post.readingTime}
                countries={post.countryLabels}
                audience={post.audienceLabels}
                cta={labels.readArticle}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-surface mt-8 rounded-2xl border p-8 text-center">
          <p className="text-subtle-foreground">{labels.noResults}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={basePath} scroll={false}>
              {labels.resetFilters}
            </Link>
          </Button>
        </div>
      )}
    </>
  )
}
