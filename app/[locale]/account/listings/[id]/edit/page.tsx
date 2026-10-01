import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ListingEditForm } from "@/components/post/listing-edit-form"
import { Link } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { loadListingForEdit } from "@/lib/listings/edit-data"

export async function generateMetadata({ params }: PageProps<"/[locale]/account/listings/[id]/edit">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "account" })
  return { title: t("editTitle") }
}

/** Single-page editor inside the dashboard (sidebar comes from the account layout). */
export default async function EditListingPage({ params }: PageProps<"/[locale]/account/listings/[id]/edit">) {
  await pageLocale(params)
  const { id } = await params
  const data = await loadListingForEdit(Number(id))
  if (!data) notFound()
  const t = await getTranslations("account")

  return (
    <div>
      <Link href="/account/listings" className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm">
        <ChevronLeft className="size-4" aria-hidden /> {t("editBack")}
      </Link>
      <h1 className="mb-5 text-2xl font-bold">{data.initial.title || t("editTitle")}</h1>
      {/* key: a fresh form after the server data changes (e.g. after saving) */}
      <ListingEditForm key={data.initial.status} initial={data.initial} emailConfirmed={data.emailConfirmed} trusted={data.trusted} />
    </div>
  )
}
