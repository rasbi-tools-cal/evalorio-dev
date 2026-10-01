import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { PrivacyRequestForm } from "@/components/legal/privacy-request-form"
import { Link } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { localizedAlternates } from "@/lib/seo"
import { getProfile, getUser } from "@/lib/supabase/server"

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy/request">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "privacyRequest" })
  return { title: t("title"), description: t("intro"), alternates: localizedAlternates(locale, () => "/privacy/request") }
}

export default async function PrivacyRequestPage({ params }: PageProps<"/[locale]/privacy/request">) {
  await pageLocale(params)
  const [t, user, profile] = await Promise.all([getTranslations("privacyRequest"), getUser(), getProfile()])
  return (
    <div className="page-container max-w-2xl py-12">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-subtle-foreground mt-3">{t("intro")}</p>
      <p className="bg-surface mt-4 rounded-lg border px-4 py-3 text-sm">
        {t.rich("selfService", {
          settings: (chunks) => (
            <Link href="/account/settings" className="text-primary font-semibold underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <div className="bg-card mt-8 rounded-xl border p-5 sm:p-6">
        <PrivacyRequestForm defaultEmail={user?.email ?? undefined} defaultName={profile?.display_name ?? undefined} />
      </div>
    </div>
  )
}
