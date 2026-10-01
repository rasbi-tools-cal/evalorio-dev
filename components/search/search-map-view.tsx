"use client"

import { Loader2, Search, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useMemo, useState, useTransition } from "react"
import { ResultsMap } from "@/components/map"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import type { MapMarker } from "@/lib/listings/queries"
import { useResultsHighlight } from "./results-highlight"

export function SearchMapView({
  markers,
  query,
  bbox,
  center,
  zoom,
  children,
}: {
  markers: MapMarker[]
  query: string
  bbox?: [number, number, number, number]
  center: [number, number]
  zoom: number
  children: React.ReactNode
}) {
  const t = useTranslations("search")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [moved, setMoved] = useState<[number, number, number, number] | null>(null)
  const { activeId, setActiveId } = useResultsHighlight()
  const [pending, start] = useTransition()

  const compact = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }),
    [locale],
  )
  const formatPrice = useCallback((p: number) => compact.format(p), [compact])
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`
  const hrefFor = useCallback((id: number) => `${prefix}/listing/${id}`, [prefix])

  const go = (nextBbox: [number, number, number, number] | null) => {
    const q = new URLSearchParams(query)
    q.delete("page")
    if (nextBbox) q.set("bbox", nextBbox.map((n) => n.toFixed(5)).join(","))
    else q.delete("bbox")
    start(() => router.push(`${pathname}?${q}`, { scroll: false }))
    setMoved(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <div className="order-2 flex flex-col gap-4 lg:order-1 lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto lg:pr-2">{children}</div>
      <div className="relative order-1 h-[60dvh] lg:sticky lg:top-24 lg:order-2 lg:h-[calc(100dvh-10rem)]">
        <ResultsMap
          markers={markers}
          fallbackCenter={center}
          fallbackZoom={zoom}
          bbox={bbox}
          formatPrice={formatPrice}
          hrefFor={hrefFor}
          onMoved={setMoved}
          activeId={activeId}
          onActiveChange={setActiveId}
          className="h-full w-full overflow-hidden rounded-xl border"
        />
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center gap-2">
          {moved && (
            <Button size="sm" className="pointer-events-auto shadow-lg" onClick={() => go(moved)} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Search aria-hidden />}
              {t("searchThisArea")}
            </Button>
          )}
          {bbox && !moved && (
            <Button size="sm" variant="outline" className="pointer-events-auto bg-background shadow-lg" onClick={() => go(null)}>
              <X aria-hidden />
              {t("removeArea")}
            </Button>
          )}
        </div>
        {markers.length >= 500 && (
          <p className="bg-background/95 absolute bottom-3 left-1/2 z-[500] -translate-x-1/2 rounded-md px-3 py-1.5 text-xs shadow">
            {t("mapTooMany")}
          </p>
        )}
      </div>
    </div>
  )
}
