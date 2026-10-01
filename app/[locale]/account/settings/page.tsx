import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { NewPasswordForm } from "@/components/auth/auth-forms"
import { DataExport, DeleteAccount, ProfileForm } from "@/components/account/settings-forms"
import { pageLocale } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"
import { getProfile, getUser } from "@/lib/supabase/server"

export async function generateMetadata({ params }: PageProps<"/[locale]/account/settings">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "account" })
  return { title: t("settingsTitle") }
}

export default async function SettingsPage({ params }: PageProps<"/[locale]/account/settings">) {
  await pageLocale(params)
  const [t, user, profile] = await Promise.all([getTranslations("account"), getUser(), getProfile()])

  const section = (title: string, children: React.ReactNode, danger = false) => (
    <section className={`bg-card rounded-xl border p-5 sm:p-6 ${danger ? "border-destructive/40" : ""}`}>
      <h2 className={`mb-4 text-lg font-semibold ${danger ? "text-destructive" : ""}`}>{title}</h2>
      {children}
    </section>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settingsTitle")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{user?.email}</p>
      </div>
      {section(
        t("profile"),
        <ProfileForm displayName={profile?.display_name ?? ""} phone={profile?.phone ?? ""} locale={(profile?.locale ?? "en") as Locale} />,
      )}
      {section(t("security"), <div className="max-w-sm"><NewPasswordForm /></div>)}
      {section(t("exportData"), <DataExport />)}
      {section(t("dangerZone"), <DeleteAccount />, true)}
    </div>
  )
}
