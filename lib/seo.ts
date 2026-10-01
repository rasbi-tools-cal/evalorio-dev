import type { Metadata } from "next"
import { routing, type Locale } from "@/i18n/routing"
import { absoluteUrl } from "@/lib/urls"

/** canonical + hreflang for a page whose path differs per language. */
export function localizedAlternates(locale: Locale, pathFor: (l: Locale) => string, query = ""): Metadata["alternates"] {
  const languages: Record<string, string> = {}
  for (const l of routing.locales) languages[l] = absoluteUrl(l, pathFor(l))
  languages["x-default"] = absoluteUrl(routing.defaultLocale, pathFor(routing.defaultLocale))
  return { canonical: absoluteUrl(locale, pathFor(locale)) + query, languages }
}

export function ogLocale(locale: Locale) {
  return { en: "en_GB", es: "es_ES", fr: "fr_FR", it: "it_IT", pt: "pt_PT" }[locale]
}
