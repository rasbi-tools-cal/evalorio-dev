import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { PostWizard } from "@/components/post/post-wizard"
import { redirect } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { DRAFT_STATUSES, loadListingForEdit } from "@/lib/listings/edit-data"
import { STEPS, type Step } from "@/lib/listings/wizard"

export async function generateMetadata({ params }: PageProps<"/[locale]/post/[id]">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "post" })
  return { title: t("title") }
}

/** Step-by-step flow for new listings. Published listings are edited on one page in the dashboard. */
export default async function DraftListingPage({ params, searchParams }: PageProps<"/[locale]/post/[id]">) {
  const locale = await pageLocale(params)
  const { id } = await params
  const { step: rawStep } = await searchParams
  const data = await loadListingForEdit(Number(id))
  if (!data) notFound()
  if (!DRAFT_STATUSES.includes(data.initial.status)) redirect({ href: `/account/listings/${id}/edit`, locale })

  const step: Step = STEPS.includes(rawStep as Step) ? (rawStep as Step) : "basics"
  const t = await getTranslations("post")

  return (
    <div className="bg-card rounded-xl border p-5 shadow-[var(--shadow-card)] sm:p-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 mb-8">{t("subtitle")}</p>
      <PostWizard initial={data.initial} initialStep={step} emailConfirmed={data.emailConfirmed} trusted={data.trusted} />
    </div>
  )
}
