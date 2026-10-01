import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { NewListingStart } from "@/components/post/post-wizard"
import { pageLocale } from "@/i18n/locale"

export async function generateMetadata({ params }: PageProps<"/[locale]/post">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "meta" })
  return { title: t("postTitle"), description: t("postDescription") }
}

export default async function NewListingPage({ params }: PageProps<"/[locale]/post">) {
  await pageLocale(params)
  const t = await getTranslations("post")
  return (
    <div className="bg-card rounded-xl border p-5 shadow-[var(--shadow-card)] sm:p-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 mb-8">{t("subtitle")}</p>
      <NewListingStart />
    </div>
  )
}
