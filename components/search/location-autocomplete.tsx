"use client"

import { Loader2, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useId, useRef, useState } from "react"
import type { CountryCode } from "@/lib/catalog"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export interface CityOption {
  id: number
  name: string
  slug: string
  region: string | null
  country_code: CountryCode
  lat: number
  lng: number
}

/** Accessible combobox (WAI-ARIA 1.2 pattern) over our own cities table — no third-party geocoder. */
export function LocationAutocomplete({
  value,
  onChange,
  country,
  placeholder,
  inputId,
  invalid,
  describedBy,
  className,
  inputClassName,
}: {
  value: CityOption | null
  onChange: (city: CityOption | null) => void
  country?: CountryCode
  placeholder?: string
  inputId?: string
  invalid?: boolean
  describedBy?: string
  className?: string
  inputClassName?: string
}) {
  const t = useTranslations("searchBar")
  const tc = useTranslations("countries")
  const generatedId = useId()
  const id = inputId ?? generatedId
  const listId = `${id}-list`
  const [query, setQuery] = useState(value?.name ?? "")
  const [options, setOptions] = useState<CityOption[]>([])
  const [listOpen, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const requestRef = useRef(0)

  // Keep the text in sync when the parent changes the selected city (render-time adjustment).
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    setQuery(value?.name ?? "")
  }

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2 || q === value?.name) return
    const request = ++requestRef.current
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await createClient().rpc("search_cities", { q, country, max_results: 8 })
      if (request !== requestRef.current) return
      setOptions((data ?? []) as CityOption[])
      setActive(-1)
      setOpen(true)
      setLoading(false)
    }, 180)
    return () => clearTimeout(timer)
  }, [query, country, value?.name])

  const searchable = query.trim().length >= 2 && query.trim() !== value?.name
  const visibleOptions = searchable ? options : []
  const open = listOpen && searchable

  const choose = (city: CityOption) => {
    onChange(city)
    setQuery(city.name)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || visibleOptions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => (i + 1) % visibleOptions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => (i <= 0 ? visibleOptions.length - 1 : i - 1))
    } else if (e.key === "Enter") {
      if (active >= 0 || visibleOptions.length > 0) {
        e.preventDefault()
        choose(visibleOptions[Math.max(active, 0)])
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={placeholder ?? t("locationPlaceholder")}
          onChange={(e) => {
            setQuery(e.target.value)
            if (value) onChange(null)
          }}
          onFocus={() => visibleOptions.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          className={cn(
            "border-input placeholder:text-muted-foreground h-11 w-full rounded-md border bg-background pr-9 pl-9 text-base outline-none md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:border-destructive",
            inputClassName,
          )}
        />
        {loading && (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" aria-hidden />
        )}
      </div>
      <ul
        id={listId}
        role="listbox"
        hidden={!open}
        className="bg-popover absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border py-1 shadow-lg"
      >
        {visibleOptions.length === 0 ? (
          <li className="text-muted-foreground px-3 py-2 text-sm">{t("noResults")}</li>
        ) : (
          visibleOptions.map((city, i) => (
            <li
              key={city.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(city)
              }}
              onMouseEnter={() => setActive(i)}
              className="aria-selected:bg-surface-low flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="font-medium">{city.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {[city.region, tc(city.country_code)].filter(Boolean).join(", ")}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
