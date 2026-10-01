import { Bell } from "lucide-react"
import { useTranslations } from "next-intl"
import { SaveSearchButton, type SaveSearchContext } from "./search-toolbar"

/** Highlighted "New listings by email" card at the top of the results sidebar. */
export function SaveSearchCard({ query, context }: { query: string; context: SaveSearchContext }) {
  const t = useTranslations("search")
  return (
    <div className="border-primary/30 bg-primary-soft flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Bell className="size-4" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold">{t("saveSearchTitle")}</p>
          <p className="text-subtle-foreground text-[13px] leading-snug">{t("saveSearchText")}</p>
        </div>
      </div>
      <SaveSearchButton query={query} context={context} variant="default" className="w-full" />
    </div>
  )
}
