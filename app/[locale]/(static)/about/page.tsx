import type { Metadata } from "next"
import { StaticPage } from "@/components/static/static-page"
import { pageLocale } from "@/i18n/locale"
import { STATIC_CONTENT } from "@/lib/static-content"
import { absoluteUrl } from "@/lib/urls"

// Static content: regenerated at most once a day.
export const revalidate = 86400

const page = STATIC_CONTENT["about"]

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  await pageLocale(params)
  // Content exists in English only for now: every language version points to it as canonical.
  return { title: page.title, description: page.description, alternates: { canonical: absoluteUrl("en", "/about") } }
}

export default async function Page({ params }: PageProps<"/[locale]/about">) {
  await pageLocale(params)
  return (
    <StaticPage title={page.title} updated={page.updated}>
      {page.body}
    </StaticPage>
  )
}
