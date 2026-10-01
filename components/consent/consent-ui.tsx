"use client"

import { Analytics } from "@vercel/analytics/next"
import { Cookie } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Link } from "@/i18n/navigation"
import { activeItems, type ConsentCategory, type OptionalCategory } from "@/lib/consent/registry"
import { cn } from "@/lib/utils"
import { ConsentGate, useConsent } from "./consent-provider"

const all = (categories: OptionalCategory[], value: boolean) =>
  ({ preferences: false, analytics: false, marketing: false, ...Object.fromEntries(categories.map((c) => [c, value])) }) as Record<
    OptionalCategory,
    boolean
  >

/** First layer: shown until a choice is made. Not a cookie wall — the site stays usable. */
export function ConsentBanner() {
  const t = useTranslations("consent")
  const { consent, categories, settingsOpen, openSettings, save } = useConsent()
  if (consent !== null || settingsOpen || categories.length === 0) return null

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-text"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-5"
    >
      <div className="bg-card mx-auto flex max-w-4xl flex-col gap-4 rounded-xl border p-5 shadow-[var(--shadow-raised)] md:flex-row md:items-end">
        <div className="flex-1">
          <h2 id="consent-title" className="flex items-center gap-2 text-base font-semibold">
            <Cookie className="text-primary size-5" aria-hidden />
            {t("bannerTitle")}
          </h2>
          <p id="consent-text" className="text-subtle-foreground mt-1.5 text-sm leading-relaxed">
            {t.rich("bannerText", {
              cookies: (chunks) => (
                <Link href="/cookies" className="text-primary underline">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className="text-primary underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
        {/* Accept and reject have the same weight (EDPB / AEPD / CNIL guidance). */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
          <Button variant="dark" onClick={() => save(all(categories, false), "reject_all")}>
            {t("rejectAll")}
          </Button>
          <Button variant="dark" onClick={() => save(all(categories, true), "accept_all")}>
            {t("acceptAll")}
          </Button>
          <Button variant="ghost" onClick={openSettings}>
            {t("customize")}
          </Button>
        </div>
      </div>
    </section>
  )
}

/** Second layer: per-category choice, with what each category contains. */
export function ConsentSettingsDialog() {
  const t = useTranslations("consent")
  const { consent, categories, settingsOpen, closeSettings, save } = useConsent()
  const [draft, setDraft] = useState<Record<OptionalCategory, boolean> | null>(null)
  const current = draft ?? consent?.categories ?? all(categories, false)
  const items = activeItems()

  const finish = (choice: Record<OptionalCategory, boolean>, action: "accept_all" | "reject_all" | "custom") => {
    save(choice, action)
    setDraft(null)
    toast.success(t("saved"))
  }

  const section = (category: ConsentCategory) => {
    const list = items.filter((i) => i.category === category)
    const optional = category !== "necessary"
    const checked = optional ? current[category as OptionalCategory] : true
    return (
      <section key={category} className="rounded-lg border p-4" aria-labelledby={`consent-${category}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id={`consent-${category}`} className="font-semibold">
              {t(`categories.${category}.title`)}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-sm">{t(`categories.${category}.description`)}</p>
          </div>
          {optional ? (
            <label className="flex shrink-0 cursor-pointer items-center gap-2">
              <input
                aria-labelledby={`consent-${category}`}
                type="checkbox"
                role="switch"
                aria-checked={checked}
                checked={checked}
                onChange={(e) => setDraft({ ...current, [category]: e.target.checked })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50",
                  checked ? "bg-primary" : "bg-input",
                )}
              >
                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
              </span>
            </label>
          ) : (
            <span className="text-primary shrink-0 text-xs font-semibold">{t("alwaysActive")}</span>
          )}
        </div>
        {list.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2 border-t pt-3 text-[13px]">
            {list.map((i) => (
              <li key={i.key}>
                <span className="font-medium">{i.type === "network" ? t(`items.${i.key}.name`) : <code className="text-xs">{i.name}</code>}</span> <span className="text-muted-foreground">· {i.provider}</span>
                <p className="text-subtle-foreground">{t(`items.${i.key}.purpose`)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  return (
    <Dialog
      open={settingsOpen}
      onOpenChange={(open) => {
        if (!open) {
          setDraft(null)
          closeSettings()
        }
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("settingsTitle")}</DialogTitle>
          <DialogDescription>
            {t.rich("settingsIntro", {
              cookies: (chunks) => (
                <Link href="/cookies" className="text-primary underline" onClick={closeSettings}>
                  {chunks}
                </Link>
              ),
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {section("necessary")}
          {categories.map((c) => section(c))}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => finish(all(categories, false), "reject_all")}>
            {t("rejectAll")}
          </Button>
          <Button variant="outline" onClick={() => finish(current, "custom")}>
            {t("saveChoices")}
          </Button>
          <Button onClick={() => finish(all(categories, true), "accept_all")}>{t("acceptAll")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Footer / cookie-policy link that reopens the settings at any time (withdrawal as easy as consent). */
export function CookieSettingsButton({ className, label }: { className?: string; label?: string }) {
  const t = useTranslations("consent")
  const { openSettings, categories } = useConsent()
  if (categories.length === 0) return null
  return (
    <button type="button" onClick={openSettings} className={cn("cursor-pointer text-left", className)}>
      {label ?? t("footerLink")}
    </button>
  )
}

/** Optional third-party tools, mounted only after consent. */
export function ConsentedScripts() {
  return (
    <ConsentGate category="analytics">
      <Analytics />
    </ConsentGate>
  )
}
