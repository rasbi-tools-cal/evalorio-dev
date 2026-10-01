import { ChevronLeft, ChevronRight } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

/** Crawlable <a> pagination (no JS needed), windowed around the current page. */
export async function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (page: number) => string }) {
  if (pages <= 1) return null
  const t = await getTranslations("search")
  const window = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages))
  const list = [...window].sort((a, b) => a - b)

  const item = "flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium"
  return (
    <nav aria-label={t("pagination")} className="flex flex-wrap items-center justify-center gap-1.5 pt-4">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(item, "hover:bg-surface-low gap-1")}>
          <ChevronLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">{t("previous")}</span>
        </Link>
      )}
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - list[i - 1] > 1 && <span className="text-muted-foreground px-1">…</span>}
          {p === page ? (
            <span aria-current="page" className={cn(item, "bg-primary text-primary-foreground border-primary")}>
              {p}
            </span>
          ) : (
            <Link href={hrefFor(p)} className={cn(item, "hover:bg-surface-low")} aria-label={t("page", { page: p })}>
              {p}
            </Link>
          )}
        </span>
      ))}
      {page < pages && (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(item, "hover:bg-surface-low gap-1")}>
          <span className="hidden sm:inline">{t("nextPage")}</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  )
}
