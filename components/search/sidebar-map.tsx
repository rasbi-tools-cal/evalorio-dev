"use client"

import { Map as MapIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useMemo } from "react"
import { MiniResultsMap } from "@/components/map"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import type { MapMarker } from "@/lib/listings/queries"
import { useResultsHighlight } from "./results-highlight"

/** Sidebar preview of the current page's results on a map, with a link to the full map view. */
export function SidebarMap({
  markers,
  center,
  zoom,
  mapHref,
}: {
  markers: MapMarker[]
  center: [number, number]
  zoom: number
  mapHref: string
}) {
  const t = useTranslations("search")
  const locale = useLocale()
  const { activeId, setActiveId } = useResultsHighlight()
  const compact = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }),
    [locale],
  )
  const formatPrice = useCallback((p: number) => compact.format(p), [compact])
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`
  const hrefFor = useCallback((id: number) => `${prefix}/listing/${id}`, [prefix])

  return (
    <div className="flex flex-col gap-2">
      <MiniResultsMap
        markers={markers}
        fallbackCenter={center}
        fallbackZoom={zoom}
        formatPrice={formatPrice}
        hrefFor={hrefFor}
        activeId={activeId}
        onActiveChange={setActiveId}
        label={t("mapOfPage")}
      />
      <Button asChild variant="outline" className="w-full">
        <Link href={mapHref} scroll={false}>
          <MapIcon aria-hidden />
          {t("seeOnMap")}
        </Link>
      </Button>
    </div>
  )
}
