import type { Metadata } from "next"
import { StaticPage } from "@/components/static/static-page"
import { pageLocale } from "@/i18n/locale"
import { STATIC_CONTENT } from "@/lib/static-content"
import { absoluteUrl } from "@/lib/urls"

const page = STATIC_CONTENT["terms"]

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">): Promise<Metadata> {
  await pageLocale(params)
  // Content exists in English only for now: every language version points to it as canonical.
  return { title: page.title, description: page.description, alternates: { canonical: absoluteUrl("en", "/terms") } }
}

export default async function Page({ params }: PageProps<"/[locale]/terms">) {
  await pageLocale(params)
  return (
    <StaticPage title={page.title} updated={page.updated}>
      {page.body}
    </StaticPage>
  )
}
