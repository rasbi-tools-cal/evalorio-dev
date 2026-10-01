"use client"

import { Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { Link, useRouter } from "@/i18n/navigation"
import { deleteSavedSearch, updateSavedSearch } from "@/lib/actions/searches"

export function SavedSearchRow({
  id,
  name,
  href,
  frequency,
  active,
}: {
  id: string
  name: string
  href: string
  frequency: "instant" | "daily" | "weekly"
  active: boolean
}) {
  const t = useTranslations("account")
  const tc = useTranslations("common")
  const router = useRouter()
  const [pending, start] = useTransition()

  const run = (fn: () => Promise<{ ok: boolean }>) =>
    start(async () => {
      const res = await fn()
      if (!res.ok) toast.error(tc("genericError"))
      router.refresh()
    })

  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <Link href={href} className="hover:text-primary font-semibold">
          {name}
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`freq-${id}`} className="sr-only">
          {t("frequency")}
        </label>
        <NativeSelect
          id={`freq-${id}`}
          value={frequency}
          disabled={pending}
          className="h-9 w-auto"
          onChange={(e) => run(() => updateSavedSearch(id, { frequency: e.target.value as "daily" }))}
        >
          <option value="instant">{t("frequencyInstant")}</option>
          <option value="daily">{t("frequencyDaily")}</option>
          <option value="weekly">{t("frequencyWeekly")}</option>
        </NativeSelect>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={active}
            disabled={pending}
            onChange={(e) => run(() => updateSavedSearch(id, { is_active: e.target.checked }))}
          />
          {active ? t("alertsOn") : t("alertsOff")}
        </label>
        <Button asChild size="sm" variant="outline">
          <Link href={href}>{t("openSearch")}</Link>
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label={tc("delete")} disabled={pending} onClick={() => run(() => deleteSavedSearch(id))}>
          <Trash2 className="text-destructive" />
        </Button>
      </div>
    </div>
  )
}
