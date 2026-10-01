import { getFormatter, getTranslations } from "next-intl/server"
import { ModerationActions, ReportActions } from "@/components/admin/admin-actions"
import { Link } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { createClient } from "@/lib/supabase/server"
import { listingPath } from "@/lib/urls"

export default async function ReportsPage({ params }: PageProps<"/[locale]/admin/reports">) {
  await pageLocale(params)
  const [t, tr, format] = await Promise.all([getTranslations("admin"), getTranslations("report"), getFormatter()])
  const supabase = await createClient()
  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, details, reporter_email, created_at, listing:listings(id, title, status)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100)

  if (!reports?.length) return <p className="bg-surface text-muted-foreground rounded-xl border border-dashed p-10 text-center">{t("emptyReports")}</p>

  const counts = new Map<number, number>()
  reports.forEach((r) => r.listing && counts.set(r.listing.id, (counts.get(r.listing.id) ?? 0) + 1))

  return (
    <ul className="flex flex-col gap-3">
      {reports.map((r) => (
        <li key={r.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">{tr(`reasons.${r.reason}`)}</p>
            <time className="text-muted-foreground text-xs">{format.dateTime(new Date(r.created_at), { dateStyle: "medium", timeStyle: "short" })}</time>
          </div>
          {r.listing && (
            <p className="text-sm">
              <Link href={listingPath(r.listing.id, r.listing.title)} className="text-primary hover:underline">
                #{r.listing.id} {r.listing.title}
              </Link>{" "}
              <span className="text-muted-foreground">
                · {r.listing.status} · {t("reportCount", { count: counts.get(r.listing.id) ?? 1 })}
              </span>
            </p>
          )}
          {r.details && <p className="text-subtle-foreground text-sm whitespace-pre-line">{r.details}</p>}
          {r.reporter_email && <p className="text-muted-foreground text-xs">{r.reporter_email}</p>}
          <div className="flex flex-wrap items-start gap-4">
            <ReportActions reportId={r.id} />
            {r.listing && r.listing.status !== "removed" && <ModerationActions listingId={r.listing.id} allowApprove={false} />}
          </div>
        </li>
      ))}
    </ul>
  )
}
