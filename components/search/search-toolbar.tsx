"use client"

import { Bell, List, Loader2, Map as MapIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { toast } from "sonner"
import { useSessionUser } from "@/components/layout/user-menu"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { usePathname, useRouter } from "@/i18n/navigation"
import { saveSearch } from "@/lib/actions/searches"
import type { CountryCode, Category, Operation } from "@/lib/catalog"
import { SORT_KEYS, type SortKey } from "@/lib/search/filters"
import { cn } from "@/lib/utils"

export interface SaveSearchContext {
  name: string
  country: CountryCode
  cityId?: number
  neighborhoodId?: number
  category: Category
  operation: Operation
}

export function SearchToolbar({ sort, view, query, saveContext }: { sort: SortKey; view: "list" | "map"; query: string; saveContext: SaveSearchContext }) {
  const t = useTranslations("search")
  const router = useRouter()
  const pathname = usePathname()

  const navigate = (mutate: (q: URLSearchParams) => void) => {
    const q = new URLSearchParams(query)
    mutate(q)
    q.delete("page")
    router.push(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false })
  }

  const sortLabels: Record<SortKey, string> = {
    newest: t("sortNewest"),
    price_asc: t("sortPriceAsc"),
    price_desc: t("sortPriceDesc"),
    area_desc: t("sortAreaDesc"),
    price_m2_asc: t("sortPriceM2Asc"),
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="sort" className="sr-only">
        {t("sort")}
      </label>
      <NativeSelect
        id="sort"
        value={sort}
        onChange={(e) => navigate((q) => (e.target.value === "newest" ? q.delete("sort") : q.set("sort", e.target.value)))}
        className="h-10 w-auto min-w-44"
      >
        {SORT_KEYS.map((k) => (
          <option key={k} value={k}>
            {sortLabels[k]}
          </option>
        ))}
      </NativeSelect>
      <div className="bg-surface-low flex rounded-md border p-0.5" role="group" aria-label={`${t("listView")} / ${t("mapView")}`}>
        {(["list", "map"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => navigate((q) => (v === "map" ? q.set("view", "map") : q.delete("view")))}
            className={cn(
              "flex h-9 cursor-pointer items-center gap-1.5 rounded px-3 text-sm font-medium",
              view === v ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v === "list" ? <List className="size-4" aria-hidden /> : <MapIcon className="size-4" aria-hidden />}
            {v === "list" ? t("listView") : t("mapView")}
          </button>
        ))}
      </div>
      {/* In list view the sidebar has its own "New listings by email" card (desktop). */}
      <SaveSearchButton query={query} context={saveContext} className={view === "list" ? "lg:hidden" : undefined} />
    </div>
  )
}

export function SaveSearchButton({
  query,
  context,
  className,
  variant = "soft",
}: {
  query: string
  context: SaveSearchContext
  className?: string
  variant?: "soft" | "default"
}) {
  const t = useTranslations("search")
  const tc = useTranslations("common")
  const { user, ready } = useSessionUser()
  const router = useRouter()
  const pathname = usePathname()
  const [pending, start] = useTransition()

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={!ready || pending}
      title={t("saveSearchText")}
      onClick={() => {
        if (!user) {
          router.push(`/login?next=${encodeURIComponent(`${pathname}${query ? `?${query}` : ""}`)}`)
          return
        }
        start(async () => {
          const { name, ...filters } = context
          const res = await saveSearch({ name, filters: { ...filters, query } })
          if (res.ok) toast.success(t("searchSaved"))
          else toast.error(tc("genericError"))
        })
      }}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Bell aria-hidden />}
      {t("saveSearch")}
    </Button>
  )
}
