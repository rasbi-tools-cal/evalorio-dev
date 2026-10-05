import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { LoginForm, LoginFormFromUrl } from "@/components/auth/auth-forms"
import { pageLocale } from "@/i18n/locale"

// Static page: ?next= / ?error= are read in the browser; signed-in users are redirected by proxy.ts.
export const revalidate = 86400

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "auth" })
  return { title: t("loginTitle") }
}

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  await pageLocale(params)
  const t = await getTranslations("auth")

  return (
    <>
      <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">{t("loginSubtitle")}</p>
      <Suspense fallback={<LoginForm />}>
        <LoginFormFromUrl />
      </Suspense>
    </>
  )
}
