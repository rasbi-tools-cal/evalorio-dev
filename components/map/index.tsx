"use client"

import dynamic from "next/dynamic"

/** Leaflet touches `window`, so maps load on the client only. */
const Placeholder = ({ className }: { className?: string }) => (
  <div className={`bg-surface-low animate-pulse rounded-lg ${className ?? "h-72"}`} aria-hidden />
)

export const LocationPickerMap = dynamic(() => import("./leaflet-maps").then((m) => m.LocationPickerMap), {
  ssr: false,
  loading: () => <Placeholder className="h-72 sm:h-80" />,
})

export const ListingLocationMap = dynamic(() => import("./leaflet-maps").then((m) => m.ListingLocationMap), {
  ssr: false,
  loading: () => <Placeholder className="h-72 sm:h-96" />,
})

export const ResultsMap = dynamic(() => import("./leaflet-maps").then((m) => m.ResultsMap), {
  ssr: false,
  loading: () => <Placeholder className="h-full min-h-80" />,
})
