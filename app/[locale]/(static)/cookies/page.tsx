import type { Metadata } from "next"
import { LegalDocument, legalMetadata } from "@/components/legal/legal-document"
import { pageLocale } from "@/i18n/locale"
import { localizedAlternates } from "@/lib/seo"

export async function generateMetadata({ params }: PageProps<"/[locale]/cookies">): Promise<Metadata> {
  const locale = await pageLocale(params)
  return { ...(await legalMetadata(locale, "cookies")), alternates: localizedAlternates(locale, () => "/cookies") }
}

export default async function Page({ params }: PageProps<"/[locale]/cookies">) {
  const locale = await pageLocale(params)
  return <LegalDocument locale={locale} page="cookies" />
}
