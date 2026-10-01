import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { SavedSearchRow } from "@/components/account/saved-search-row"
import { pageLocale } from "@/i18n/locale"
import type { Category, CountryCode, Operation } from "@/lib/catalog"
import type { SavedSearchFilters } from "@/lib/search/filters"
import { createClient } from "@/lib/supabase/server"
import { searchPath } from "@/lib/urls"

export async function generateMetadata({ params }: PageProps<"/[locale]/account/searches">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "account" })
  return { title: t("savedSearchesTitle") }
}

export default async function SavedSearchesPage({ params }: PageProps<"/[locale]/account/searches">) {
  const locale = await pageLocale(params)
  const t = await getTranslations("account")
  const supabase = await createClient()
  const { data: searches } = await supabase
    .from("saved_searches")
    .select("id, name, filters, frequency, is_active, created_at")
    .order("created_at", { ascending: false })

  const all = (searches ?? []).map((s) => ({ ...s, filters: s.filters as unknown as SavedSearchFilters }))
  const cityIds = [...new Set(all.map((s) => s.filters.cityId).filter(Boolean))] as number[]
  const hoodIds = [...new Set(all.map((s) => s.filters.neighborhoodId).filter(Boolean))] as number[]
  const [{ data: cities }, { data: hoods }] = await Promise.all([
    cityIds.length ? supabase.from("cities").select("id, slug").in("id", cityIds) : Promise.resolve({ data: [] as { id: number; slug: string }[] }),
    hoodIds.length ? supabase.from("neighborhoods").select("id, slug").in("id", hoodIds) : Promise.resolve({ data: [] as { id: number; slug: string }[] }),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("savedSearchesTitle")}</h1>
      {all.length === 0 ? (
        <p className="bg-surface text-muted-foreground rounded-xl border border-dashed p-10 text-center">{t("noSavedSearches")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {all.map((s) => {
            const href = searchPath(locale, {
              country: s.filters.country as CountryCode,
              city: cities?.find((c) => c.id === s.filters.cityId)?.slug,
              neighborhood: hoods?.find((h) => h.id === s.filters.neighborhoodId)?.slug,
              category: s.filters.category as Category,
              operation: s.filters.operation as Operation,
              query: s.filters.query,
            })
            return (
              <li key={s.id}>
                <SavedSearchRow id={s.id} name={s.name} href={href} frequency={s.frequency} active={s.is_active} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
