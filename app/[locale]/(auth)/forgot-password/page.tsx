import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ForgotPasswordForm } from "@/components/auth/auth-forms"
import { pageLocale } from "@/i18n/locale"

// Static content: regenerated at most once a day.
export const revalidate = 86400

export async function generateMetadata({ params }: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "auth" })
  return { title: t("resetTitle") }
}

export default async function ForgotPasswordPage({ params }: PageProps<"/[locale]/forgot-password">) {
  await pageLocale(params)
  const t = await getTranslations("auth")
  return (
    <>
      <h1 className="text-2xl font-bold">{t("resetTitle")}</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">{t("resetText")}</p>
      <ForgotPasswordForm />
    </>
  )
}
