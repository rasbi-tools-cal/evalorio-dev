import { getFormatter, getTranslations } from "next-intl/server"
import { PrivacyRequestControls } from "@/components/admin/privacy-request-row"
import { Badge } from "@/components/ui/badge"
import { pageLocale } from "@/i18n/locale"
import { createClient } from "@/lib/supabase/server"

export default async function AdminPrivacyPage({ params }: PageProps<"/[locale]/admin/privacy">) {
  await pageLocale(params)
  const [t, tr, format, supabase] = await Promise.all([getTranslations("privacyAdmin"), getTranslations("privacyRequest"), getFormatter(), createClient()])
  const { data: requests } = await supabase
    .from("privacy_requests")
    .select("id, reference, type, status, email, name, details, locale, user_id, admin_note, created_at, due_at, resolved_at")
    .order("resolved_at", { ascending: true, nullsFirst: true })
    .order("due_at", { ascending: true })
    .limit(200)

  if (!requests?.length) return <p className="text-muted-foreground">{t("empty")}</p>
  const now = new Date()

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      {requests.map((r) => {
        const open = !r.resolved_at
        const overdue = open && new Date(r.due_at) < now
        return (
          <article key={r.id} className={`bg-card rounded-xl border p-4 ${overdue ? "border-destructive" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono font-semibold">{r.reference}</span>
              <Badge variant="secondary">{tr(`types.${r.type}`)}</Badge>
              <Badge variant={open ? "default" : "outline"}>{t(`statuses.${r.status}`)}</Badge>
              {overdue && <Badge variant="destructive">{t("overdue")}</Badge>}
              <span className="text-muted-foreground ml-auto text-xs">
                {format.dateTime(new Date(r.created_at), { dateStyle: "medium" })} · {t("due", { date: format.dateTime(new Date(r.due_at), { dateStyle: "medium" }) })}
              </span>
            </div>
            <p className="mt-2 text-sm">
              <a href={`mailto:${r.email}?subject=${encodeURIComponent(r.reference)}`} className="text-primary font-medium underline">
                {r.email}
              </a>
              {r.name && <span className="text-muted-foreground"> · {r.name}</span>}
              <span className="text-muted-foreground"> · {r.locale.toUpperCase()}</span>
              {r.user_id && <span className="text-muted-foreground"> · account {r.user_id.slice(0, 8)}</span>}
            </p>
            {r.details && <p className="text-subtle-foreground mt-2 text-sm whitespace-pre-line">{r.details}</p>}
            <div className="mt-3 border-t pt-3">
              <PrivacyRequestControls id={r.id} status={r.status} note={r.admin_note ?? ""} />
            </div>
          </article>
        )
      })}
    </div>
  )
}
