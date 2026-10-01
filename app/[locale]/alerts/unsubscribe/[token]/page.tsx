import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { UnsubscribeButton } from "@/components/account/unsubscribe-button"
import { pageLocale } from "@/i18n/locale"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Confirmation step, so link scanners in mail clients can't unsubscribe people by prefetching. */
export default async function UnsubscribePage({ params }: PageProps<"/[locale]/alerts/unsubscribe/[token]">) {
  await pageLocale(params)
  const { token } = await params
  if (!/^[0-9a-f-]{36}$/.test(token)) notFound()
  const { data } = await createAdminClient().from("saved_searches").select("name, is_active").eq("unsubscribe_token", token).maybeSingle()
  if (!data) notFound()
  const t = await getTranslations("alerts")

  return (
    <div className="page-container flex flex-col items-center py-24 text-center">
      <h1 className="text-2xl font-bold">{t("unsubscribe")}</h1>
      <p className="text-muted-foreground mt-2">“{data.name}”</p>
      <UnsubscribeButton token={token} alreadyOff={!data.is_active} />
    </div>
  )
}
