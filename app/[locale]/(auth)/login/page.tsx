import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LoginForm } from "@/components/auth/auth-forms"
import { redirect } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { getUser } from "@/lib/supabase/server"
import { safeNextPath } from "@/lib/urls"

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "auth" })
  return { title: t("loginTitle") }
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const locale = await pageLocale(params)
  const { next, error } = await searchParams
  const nextPath = typeof next === "string" ? safeNextPath(next) : undefined
  if (await getUser()) redirect({ href: nextPath ?? "/account/listings", locale })
  const t = await getTranslations("auth")

  return (
    <>
      <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">{t("loginSubtitle")}</p>
      <LoginForm next={nextPath} initialError={error ? t("callbackError") : undefined} />
    </>
  )
}
