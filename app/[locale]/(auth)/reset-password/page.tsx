import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { NewPasswordForm } from "@/components/auth/auth-forms"
import { redirect } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { getUser } from "@/lib/supabase/server"

export async function generateMetadata({ params }: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "auth" })
  return { title: t("newPasswordTitle") }
}

/** Reached from the recovery email (the confirm route signs the user in first). */
export default async function ResetPasswordPage({ params }: PageProps<"/[locale]/reset-password">) {
  const locale = await pageLocale(params)
  if (!(await getUser())) redirect({ href: "/forgot-password", locale })
  const t = await getTranslations("auth")
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t("newPasswordTitle")}</h1>
      <NewPasswordForm />
    </>
  )
}
