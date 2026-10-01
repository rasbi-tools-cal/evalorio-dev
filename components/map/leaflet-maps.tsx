"use client"

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useEffectEvent, useRef } from "react"
import { MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from "@/lib/env"

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#006948"/><circle cx="18" cy="18" r="7" fill="#fff"/></svg>`

export const pinIcon = () =>
  L.divIcon({ html: PIN_SVG, className: "", iconSize: [36, 44], iconAnchor: [18, 44] })

function baseMap(el: HTMLElement, opts: L.MapOptions & { center: [number, number]; zoom: number }) {
  const map = L.map(el, { zoomControl: true, attributionControl: true, ...opts })
  L.tileLayer(MAP_TILE_URL, { attribution: MAP_TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)
  return map
}

/** Draggable pin for the post-listing flow. */
export function LocationPickerMap({
  center,
  value,
  onChange,
  zoom = 14,
  label,
}: {
  center: [number, number]
  value: [number, number] | null
  onChange: (point: [number, number]) => void
  zoom?: number
  label: string
}) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const emitChange = useEffectEvent((point: [number, number]) => onChange(point))
  const initial = useEffectEvent(() => ({ start: value ?? center, hasValue: Boolean(value), zoom, label }))

  useEffect(() => {
    if (!el.current) return
    // The map is created once; later value/center changes are applied by the effect below.
    const { start, hasValue, zoom: z, label: title } = initial()
    const m = baseMap(el.current, { center: start, zoom: z })
    const mk = L.marker(start, { draggable: true, icon: pinIcon(), keyboard: true, title, alt: title }).addTo(m)
    mk.on("dragend", () => {
      const p = mk.getLatLng()
      emitChange([p.lat, p.lng])
    })
    m.on("click", (e: L.LeafletMouseEvent) => {
      mk.setLatLng(e.latlng)
      emitChange([e.latlng.lat, e.latlng.lng])
    })
    map.current = m
    marker.current = mk
    if (!hasValue) emitChange(start)
    return () => {
      m.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current || !marker.current) return
    const target = value ?? center
    const current = marker.current.getLatLng()
    if (Math.abs(current.lat - target[0]) > 1e-7 || Math.abs(current.lng - target[1]) > 1e-7) {
      marker.current.setLatLng(target)
      map.current.setView(target, Math.max(map.current.getZoom(), 13))
    }
  }, [center, value])

  return <div ref={el} className="relative z-0 h-72 w-full rounded-lg border sm:h-80" role="application" aria-label={label} />
}

/** Read-only map for the listing page: exact pin or ~150 m circle. */
export function ListingLocationMap({ lat, lng, exact, label }: { lat: number; lng: number; exact: boolean; label: string }) {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!el.current) return
    const m = baseMap(el.current, { center: [lat, lng], zoom: exact ? 16 : 15, scrollWheelZoom: false })
    if (exact) L.marker([lat, lng], { icon: pinIcon(), keyboard: false, alt: label }).addTo(m)
    else L.circle([lat, lng], { radius: 250, color: "#006948", weight: 2, fillColor: "#006948", fillOpacity: 0.15 }).addTo(m)
    return () => {
      m.remove()
    }
  }, [lat, lng, exact, label])
  return <div ref={el} className="relative z-0 h-72 w-full rounded-lg border sm:h-96" role="img" aria-label={label} />
}

export interface MarkerPoint {
  id: number
  price: number
  lat: number
  lng: number
}

/** Search results map with price bubbles; reports the visible bounds when the user moves it. */
export function ResultsMap({
  markers,
  fallbackCenter,
  fallbackZoom,
  bbox,
  formatPrice,
  hrefFor,
  onMoved,
  activeId,
  className,
}: {
  markers: MarkerPoint[]
  fallbackCenter: [number, number]
  fallbackZoom: number
  bbox?: [number, number, number, number]
  formatPrice: (price: number) => string
  hrefFor: (id: number) => string
  onMoved: (bbox: [number, number, number, number]) => void
  activeId?: number | null
  className?: string
}) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const markerRefs = useRef(new Map<number, L.Marker>())
  const emitMoved = useEffectEvent((b: [number, number, number, number]) => onMoved(b))
  const initialView = useEffectEvent(() => ({ center: fallbackCenter, zoom: fallbackZoom }))
  const programmatic = useRef(false)

  useEffect(() => {
    if (!el.current) return
    const m = baseMap(el.current, initialView())
    layer.current = L.layerGroup().addTo(m)
    m.on("moveend", () => {
      if (programmatic.current) {
        programmatic.current = false
        return
      }
      const b = m.getBounds()
      emitMoved([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
    })
    map.current = m
    return () => {
      m.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const m = map.current
    const group = layer.current
    if (!m || !group) return
    group.clearLayers()
    markerRefs.current.clear()
    for (const p of markers) {
      const icon = L.divIcon({
        html: `<a class="price-marker" href="${hrefFor(p.id)}">${formatPrice(p.price)}</a>`,
        className: "",
        iconSize: [0, 0],
      })
      const mk = L.marker([p.lat, p.lng], { icon, keyboard: false, riseOnHover: true })
      mk.addTo(group)
      markerRefs.current.set(p.id, mk)
    }
    programmatic.current = true
    if (bbox) {
      m.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]])
    } else if (markers.length > 0) {
      m.fitBounds(L.latLngBounds(markers.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 15 })
    } else {
      m.setView(fallbackCenter, fallbackZoom)
    }
  }, [markers, bbox, fallbackCenter, fallbackZoom, formatPrice, hrefFor])

  useEffect(() => {
    markerRefs.current.forEach((mk, id) => {
      const a = mk.getElement()?.querySelector(".price-marker")
      if (a) a.setAttribute("data-active", String(id === activeId))
      mk.setZIndexOffset(id === activeId ? 1000 : 0)
    })
  }, [activeId])

  return <div ref={el} className={`relative z-0 ${className ?? ""}`} role="region" aria-label="Map" />
}
