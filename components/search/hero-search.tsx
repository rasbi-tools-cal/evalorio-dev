"use client"

import { Search } from "lucide-react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { useRouter } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { categoriesFor, type Category, type Operation } from "@/lib/catalog"
import { searchPath } from "@/lib/urls"
import { cn } from "@/lib/utils"
import { LocationAutocomplete, type CityOption } from "./location-autocomplete"

const MAX_PRICES: Record<Operation, number[]> = {
  sale: [100_000, 200_000, 300_000, 450_000, 750_000, 1_000_000, 1_500_000],
  rent: [500, 750, 1_000, 1_500, 2_000, 3_000],
}

export function HeroSearch() {
  const t = useTranslations("searchBar")
  const to = useTranslations("operations")
  const tcat = useTranslations("categories")
  const format = useFormatter()
  const locale = useLocale() as Locale
  const router = useRouter()

  const [operation, setOperation] = useState<Operation>("sale")
  const [category, setCategory] = useState<Category>("homes")
  const [city, setCity] = useState<CityOption | null>(null)
  const [maxPrice, setMaxPrice] = useState("")
  const [error, setError] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!city) {
      setError(true)
      document.getElementById("hero-location")?.focus()
      return
    }
    const query = new URLSearchParams()
    if (maxPrice) query.set("price_max", maxPrice)
    router.push(searchPath(locale, { country: city.country_code, city: city.slug, category, operation, query }))
  }

  return (
    <form onSubmit={submit} className="bg-card rounded-xl border p-3 shadow-[var(--shadow-card)] sm:p-4" role="search">
      <div role="radiogroup" aria-label={to("sale") + " / " + to("rent")} className="mb-3 flex gap-1">
        {(["sale", "rent"] as const).map((op) => (
          <button
            key={op}
            type="button"
            role="radio"
            aria-checked={operation === op}
            onClick={() => {
              setOperation(op)
              setMaxPrice("")
              if (op === "sale" && category === "rooms") setCategory("homes")
            }}
            className={cn(
              "cursor-pointer rounded-md px-5 py-2 text-sm font-semibold transition-colors",
              operation === op ? "bg-inverse text-inverse-foreground" : "text-subtle-foreground hover:bg-surface-low",
            )}
          >
            {op === "sale" ? to("saleShort") : to("rentShort")}
          </button>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-12">
        <div className="md:col-span-5">
          <label htmlFor="hero-location" className="sr-only">
            {t("location")}
          </label>
          <LocationAutocomplete
            inputId="hero-location"
            value={city}
            onChange={(c) => {
              setCity(c)
              if (c) setError(false)
            }}
            invalid={error}
            describedBy={error ? "hero-location-error" : undefined}
            inputClassName="h-12"
          />
        </div>
        <div className="md:col-span-3">
          <label htmlFor="hero-category" className="sr-only">
            {t("propertyType")}
          </label>
          <NativeSelect
            id="hero-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="h-12"
          >
            {categoriesFor(operation).map((c) => (
              <option key={c} value={c}>
                {tcat(c)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="hero-price" className="sr-only">
            {t("maxPrice")}
          </label>
          <NativeSelect id="hero-price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-12">
            <option value="">{t("maxPrice")}</option>
            {MAX_PRICES[operation].map((p) => (
              <option key={p} value={p}>
                {t("upTo", { price: format.number(p, "price") })}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" size="lg" className="md:col-span-2">
          <Search aria-hidden />
          {t("submit")}
        </Button>
      </div>
      {error && (
        <p id="hero-location-error" role="alert" className="text-destructive mt-2 text-sm">
          {t("chooseLocation")}
        </p>
      )}
    </form>
  )
}
