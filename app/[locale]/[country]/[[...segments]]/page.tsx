import type { Metadata } from "next"
import { parseFilters } from "@/lib/search/filters"
import { SearchView, searchMetadata } from "./search-view"

// ISR: the unfiltered search page (what crawlers and most links hit) is generated on its first visit
// and served from the CDN, refreshed at most hourly. URLs with filter/page/sort/view parameters are
// rewritten to the dynamic twin at /[locale]/filtered/... (see searchRewrites in next.config.mjs).
export const revalidate = 3600

export function generateStaticParams() {
  return []
}

const DEFAULT_FILTERS = parseFilters({})

export function generateMetadata({ params }: PageProps<"/[locale]/[country]/[[...segments]]">): Promise<Metadata> {
  return searchMetadata(params, DEFAULT_FILTERS)
}

export default function SearchPage({ params }: PageProps<"/[locale]/[country]/[[...segments]]">) {
  return <SearchView params={params} filters={DEFAULT_FILTERS} />
}
