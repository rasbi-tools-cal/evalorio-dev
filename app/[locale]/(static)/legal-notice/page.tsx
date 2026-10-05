import type { Metadata } from "next"
import { LegalDocument, legalMetadata } from "@/components/legal/legal-document"
import { pageLocale } from "@/i18n/locale"
import { localizedAlternates } from "@/lib/seo"

// Static content: regenerated at most once a day.
export const revalidate = 86400

export async function generateMetadata({ params }: PageProps<"/[locale]/legal-notice">): Promise<Metadata> {
  const locale = await pageLocale(params)
  return { ...(await legalMetadata(locale, "legal-notice")), alternates: localizedAlternates(locale, () => "/legal-notice") }
}

export default async function Page({ params }: PageProps<"/[locale]/legal-notice">) {
  const locale = await pageLocale(params)
  return <LegalDocument locale={locale} page="legal-notice" />
}
