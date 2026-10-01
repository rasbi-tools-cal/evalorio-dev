import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { SignupForm } from "@/components/auth/auth-forms"
import { redirect } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { getUser } from "@/lib/supabase/server"
import { safeNextPath } from "@/lib/urls"

export async function generateMetadata({ params }: PageProps<"/[locale]/signup">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "auth" })
  return { title: t("signupTitle") }
}

export default async function SignupPage({ params, searchParams }: PageProps<"/[locale]/signup">) {
  const locale = await pageLocale(params)
  const { next } = await searchParams
  const nextPath = typeof next === "string" ? safeNextPath(next) : undefined
  if (await getUser()) redirect({ href: nextPath ?? "/account/listings", locale })
  const t = await getTranslations("auth")

  return (
    <>
      <h1 className="text-2xl font-bold">{t("signupTitle")}</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">{t("signupSubtitle")}</p>
      <SignupForm next={nextPath} />
    </>
  )
}
