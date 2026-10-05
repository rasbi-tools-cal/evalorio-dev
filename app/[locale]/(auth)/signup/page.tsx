import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import { SignupForm, SignupFormFromUrl } from "@/components/auth/auth-forms"
import { pageLocale } from "@/i18n/locale"

// Static page: ?next= is read in the browser; signed-in users are redirected by proxy.ts.
export const revalidate = 86400

export async function generateMetadata({ params }: PageProps<"/[locale]/signup">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "auth" })
  return { title: t("signupTitle") }
}

export default async function SignupPage({ params }: PageProps<"/[locale]/signup">) {
  await pageLocale(params)
  const t = await getTranslations("auth")

  return (
    <>
      <h1 className="text-2xl font-bold">{t("signupTitle")}</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">{t("signupSubtitle")}</p>
      <Suspense fallback={<SignupForm />}>
        <SignupFormFromUrl />
      </Suspense>
    </>
  )
}
