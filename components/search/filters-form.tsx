"use client"

import { Loader2, SlidersHorizontal } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useEffect, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname, useRouter } from "@/i18n/navigation"
import { countResults, type CountScope } from "@/lib/actions/search-count"
import { FEATURES, type Operation, type PropertyType } from "@/lib/catalog"
import type { SearchFilters } from "@/lib/search/filters"
import { cn } from "@/lib/utils"

const PRICES: Record<Operation, number[]> = {
  sale: [50_000, 100_000, 150_000, 200_000, 250_000, 300_000, 400_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000],
  rent: [300, 500, 700, 900, 1_100, 1_300, 1_500, 2_000, 2_500, 3_000, 4_000],
}
const AREAS = [40, 60, 80, 100, 120, 150, 200, 300, 500]
const FEATURE_FILTERS = FEATURES.filter((f) => !["built_in_wardrobes", "storage_room", "doorman"].includes(f))

type Props = {
  filters: SearchFilters
  operation: Operation
  types: PropertyType[]
  total: number
}

function queryFromForm(form: HTMLFormElement, filters: SearchFilters) {
  const data = new FormData(form)
  const q = new URLSearchParams()
  const multi = (key: string) => data.getAll(key).map(String).filter(Boolean)
  const single = (key: string) => String(data.get(key) ?? "")
  if (multi("types").length) q.set("types", multi("types").join(","))
  for (const key of ["price_min", "price_max", "beds", "baths", "area_min", "area_max"]) if (single(key)) q.set(key, single(key))
  if (multi("features").length) q.set("features", multi("features").sort().join(","))
  if (filters.bbox) q.set("bbox", filters.bbox.join(","))
  if (filters.sort !== "newest") q.set("sort", filters.sort)
  if (filters.view === "map") q.set("view", "map")
  return q
}

/**
 * Plain GET form: works without JavaScript. Sidebar mode navigates on every change; drawer mode
 * (mobile) keeps changes local, shows a live "Show X results" count and applies on submit.
 */
function FiltersBody({
  filters,
  operation,
  types,
  total,
  onApplied,
  countScope,
}: Props & { onApplied?: () => void; countScope?: CountScope }) {
  const t = useTranslations("filters")
  const ts = useTranslations("search")
  const tt = useTranslations("types")
  const tf = useTranslations("features")
  const format = useFormatter()
  const router = useRouter()
  const pathname = usePathname()
  const [formKey, setFormKey] = useState(0)
  const [liveCount, setLiveCount] = useState(total)
  const [counting, startCount] = useTransition()
  const countTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drawer = Boolean(onApplied)

  useEffect(() => () => {
    if (countTimer.current) clearTimeout(countTimer.current)
  }, [])

  const recount = (form: HTMLFormElement) => {
    if (!countScope) return
    const query = queryFromForm(form, filters).toString()
    if (countTimer.current) clearTimeout(countTimer.current)
    countTimer.current = setTimeout(() => {
      startCount(async () => {
        const n = await countResults(countScope, query)
        if (n != null) setLiveCount(n)
      })
    }, 250)
  }

  const apply = (form: HTMLFormElement) => {
    const q = queryFromForm(form, filters)
    router.push(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false })
    onApplied?.()
  }

  const reset = () => {
    const q = new URLSearchParams()
    if (filters.view === "map") q.set("view", "map")
    setFormKey((k) => k + 1)
    router.push(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false })
    onApplied?.()
  }

  const price = (p: number) => format.number(p, "price")

  return (
    <form
      key={formKey}
      method="get"
      onSubmit={(e) => {
        e.preventDefault()
        apply(e.currentTarget)
      }}
      onChange={(e) => {
        if (drawer) recount(e.currentTarget)
        else apply(e.currentTarget)
      }}
      className="flex flex-col gap-5"
    >
      {types.length > 1 && (
        <fieldset className="flex flex-col gap-2 border-b pb-5">
          <legend className="mb-2 text-sm font-semibold">{t("type")}</legend>
          {types.map((type) => (
            <label key={type} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" name="types" value={type} defaultChecked={filters.types?.includes(type)} className="accent-primary size-4" />
              {tt(type)}
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="border-b pb-5">
        <legend className="mb-2 text-sm font-semibold">{t("price")}</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor="price_min">{`${t("price")} ${t("min")}`}</label>
          <NativeSelect id="price_min" name="price_min" defaultValue={filters.priceMin ?? ""}>
            <option value="">{t("min")}</option>
            {PRICES[operation].map((p) => (
              <option key={p} value={p}>
                {price(p)}
              </option>
            ))}
          </NativeSelect>
          <label className="sr-only" htmlFor="price_max">{`${t("price")} ${t("max")}`}</label>
          <NativeSelect id="price_max" name="price_max" defaultValue={filters.priceMax ?? ""}>
            <option value="">{t("max")}</option>
            {PRICES[operation].map((p) => (
              <option key={p} value={p}>
                {price(p)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </fieldset>

      <Segmented name="beds" legend={t("bedrooms")} value={filters.bedrooms} options={[0, 1, 2, 3, 4]} anyLabel={t("any")} plus={(v) => (v === 0 ? "0+" : t("plus", { value: v }))} />
      <Segmented name="baths" legend={t("bathrooms")} value={filters.bathrooms} options={[1, 2, 3]} anyLabel={t("any")} plus={(v) => t("plus", { value: v })} />

      <fieldset className="border-b pb-5">
        <legend className="mb-2 text-sm font-semibold">{t("area")}</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor="area_min">{`${t("area")} ${t("min")}`}</label>
          <NativeSelect id="area_min" name="area_min" defaultValue={filters.areaMin ?? ""}>
            <option value="">{t("min")}</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a} m²
              </option>
            ))}
          </NativeSelect>
          <label className="sr-only" htmlFor="area_max">{`${t("area")} ${t("max")}`}</label>
          <NativeSelect id="area_max" name="area_max" defaultValue={filters.areaMax ?? ""}>
            <option value="">{t("max")}</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a} m²
              </option>
            ))}
          </NativeSelect>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2 pb-2">
        <legend className="mb-2 text-sm font-semibold">{t("features")}</legend>
        {FEATURE_FILTERS.map((f) => (
          <label key={f} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" name="features" value={f} defaultChecked={filters.features?.includes(f)} className="accent-primary size-4" />
            {tf(f)}
          </label>
        ))}
      </fieldset>

      {drawer ? (
        <div className="bg-background sticky bottom-0 -mx-4 flex gap-2 border-t px-4 py-3">
          <Button type="button" variant="secondary" onClick={reset}>
            {t("reset")}
          </Button>
          <Button type="submit" size="lg" className="flex-1" aria-live="polite">
            {counting && <Loader2 className="animate-spin" aria-hidden />}
            {ts("showResults", { count: liveCount })}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <noscript>
            <Button type="submit">{t("apply")}</Button>
          </noscript>
          <Button type="button" variant="secondary" onClick={reset}>
            {t("reset")}
          </Button>
        </div>
      )}
    </form>
  )
}

function Segmented({
  name,
  legend,
  value,
  options,
  anyLabel,
  plus,
}: {
  name: string
  legend: string
  value?: number
  options: number[]
  anyLabel: string
  plus: (v: number) => string
}) {
  return (
    <fieldset className="border-b pb-5">
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length + 1}, minmax(0, 1fr))` }}>
        {[undefined, ...options].map((opt) => (
          <label
            key={opt ?? "any"}
            className="has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary has-[:focus-visible]:ring-ring/50 bg-surface-low flex cursor-pointer items-center justify-center rounded-md border py-2 text-xs font-medium has-[:focus-visible]:ring-[3px]"
          >
            <input type="radio" name={name} value={opt ?? ""} defaultChecked={value === opt} className="sr-only" />
            {opt === undefined ? anyLabel : plus(opt)}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function FiltersSidebar(props: Props) {
  return (
    <div className={cn("hidden lg:block")}>
      <FiltersBody {...props} />
    </div>
  )
}

/** Mobile: a floating "Filters (n)" button that opens the filters in a bottom drawer. */
export function FiltersSheetButton(props: Props & { activeCount: number; countScope: CountScope }) {
  const t = useTranslations("search")
  const tc = useTranslations("common")
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="lg" className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full px-6 shadow-[var(--shadow-raised)] lg:hidden">
          <SlidersHorizontal aria-hidden />
          {props.activeCount > 0 ? t("filtersCount", { count: props.activeCount }) : t("filters")}
        </Button>
      </SheetTrigger>
      <SheetContent title={t("filters")} closeLabel={tc("close")} side="bottom">
        <div className="px-4 pt-4">
          <FiltersBody {...props} onApplied={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
