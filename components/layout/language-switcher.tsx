"use client"

import { Globe } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { routing, type Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"

export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  pt: "Português",
}

const homeFor = (l: Locale) => (l === routing.defaultLocale ? "/" : `/${l}`)

/**
 * Pages publish their translated URLs as <link rel="alternate" hreflang>, because localized
 * slugs differ per language (/spain/... vs /es/espana/...). Read them at click time; the plain
 * href (that language's home page) is the no-JS fallback.
 */
function goToLanguage(e: React.MouseEvent, l: Locale) {
  const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${l}"]`)
  if (link?.href) {
    e.preventDefault()
    window.location.assign(link.href)
  }
}

export function LanguageSwitcher({ className, variant = "menu" }: { className?: string; variant?: "menu" | "list" }) {
  const locale = useLocale() as Locale
  const t = useTranslations("nav")

  if (variant === "list") {
    return (
      <ul className={cn("grid grid-cols-2 gap-1", className)} aria-label={t("language")}>
        {routing.locales.map((l) => (
          <li key={l}>
            <a
              href={homeFor(l)}
              hrefLang={l}
              onClick={(e) => goToLanguage(e, l)}
              aria-current={l === locale ? "true" : undefined}
              className="hover:bg-surface-low aria-[current]:text-primary block rounded-md px-3 py-2 text-sm aria-[current]:font-semibold"
            >
              {LANGUAGE_NAMES[l]}
            </a>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          "text-subtle-foreground hover:bg-surface-low flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          className,
        )}
        aria-label={`${t("language")}: ${LANGUAGE_NAMES[locale]}`}
      >
        <Globe className="size-4" aria-hidden />
        {locale} · EUR
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <a href={homeFor(l)} hrefLang={l} onClick={(e) => goToLanguage(e, l)} className={l === locale ? "text-primary font-semibold" : undefined}>
              {LANGUAGE_NAMES[l]}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
