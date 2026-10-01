import { getFormatter, getTranslations } from "next-intl/server"
import { CookieSettingsButton } from "@/components/consent/consent-ui"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { createClient } from "@/lib/supabase/server"

const OPTIONAL = ["preferences", "analytics", "marketing"] as const

/** Account settings: cookie choices, consent history and privacy requests (Arts. 7(3), 15–22 GDPR). */
export async function PrivacySection() {
  const [t, tc, tr, ta, format, supabase] = await Promise.all([
    getTranslations("privacySettings"),
    getTranslations("consent"),
    getTranslations("privacyRequest"),
    getTranslations("privacyAdmin"),
    getFormatter(),
    createClient(),
  ])
  const [{ data: consents }, { data: requests }] = await Promise.all([
    supabase.from("consent_records").select("id, action, categories, policy_version, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("privacy_requests").select("id, reference, type, status, created_at").order("created_at", { ascending: false }).limit(10),
  ])

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-sm">{t("text")}</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <CookieSettingsButton label={tc("footerLink")} />
        </Button>
        <Button asChild variant="outline">
          <Link href="/privacy/request">{t("makeRequest")}</Link>
        </Button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">{t("consentHistory")}</h3>
        {consents?.length ? (
          <ul className="divide-y rounded-lg border text-sm">
            {consents.map((c) => {
              const cats = c.categories as Record<string, boolean>
              const on = OPTIONAL.filter((k) => cats[k])
              const off = OPTIONAL.filter((k) => cats[k] === false)
              return (
                <li key={c.id} className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:gap-3">
                  <time className="text-muted-foreground shrink-0 text-xs sm:w-36">{format.dateTime(new Date(c.created_at), { dateStyle: "medium", timeStyle: "short" })}</time>
                  <span>
                    {on.length > 0 && (
                      <>
                        {t("accepted")}: {on.map((k) => tc(`categories.${k}.title`)).join(", ")}.{" "}
                      </>
                    )}
                    {off.length > 0 && (
                      <>
                        {t("rejected")}: {off.map((k) => tc(`categories.${k}.title`)).join(", ")}.
                      </>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noConsents")}</p>
        )}
      </div>

      {requests && requests.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">{t("requests")}</h3>
          <ul className="divide-y rounded-lg border text-sm">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap gap-x-3 px-3 py-2">
                <span className="font-mono">{r.reference}</span>
                <span>{tr(`types.${r.type}`)}</span>
                <span className="text-muted-foreground">{ta(`statuses.${r.status}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
