import type { Metadata } from "next"
import { parseFilters } from "@/lib/search/filters"
import { SearchView, searchMetadata } from "../../../[country]/[[...segments]]/search-view"

// Dynamic twin of the search page, for URLs carrying filter/page/sort/view parameters. Never linked:
// next.config.mjs rewrites /{country}/...?price_min=... here, so the visible URL stays the same.

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/filtered/[country]/[[...segments]]">): Promise<Metadata> {
  return searchMetadata(params, parseFilters(await searchParams))
}

export default async function FilteredSearchPage({ params, searchParams }: PageProps<"/[locale]/filtered/[country]/[[...segments]]">) {
  return <SearchView params={params} filters={parseFilters(await searchParams)} />
}
