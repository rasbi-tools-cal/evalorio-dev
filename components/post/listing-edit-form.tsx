"use client"

import { ExternalLink, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Link, useRouter } from "@/i18n/navigation"
import { saveContact, saveDetails, saveLocation, submitListing } from "@/lib/actions/listings"
import type { WizardListing } from "@/lib/listings/wizard"
import { ownerListingPath } from "@/lib/urls"
import { cn } from "@/lib/utils"
import {
  BasicsFields,
  ContactFields,
  DetailsFields,
  focusFirstError,
  LocationFields,
  locationPayload,
  PhotosField,
  PublishTerms,
  serverErrorMessage,
  useListingForm,
  validateContact,
  validateDetails,
  validateLocation,
  type Errors,
} from "./listing-fields"

const STATUS_STYLE: Record<string, string> = {
  active: "bg-primary-soft text-primary-soft-foreground",
  pending: "bg-surface-container text-foreground",
  draft: "bg-surface-low text-muted-foreground",
  paused: "bg-surface-low text-muted-foreground",
  rejected: "bg-warning-soft text-warning",
  expired: "bg-warning-soft text-warning",
  closed: "bg-surface-low text-muted-foreground",
}

/** Statuses that need an explicit "publish" (terms + moderation) after saving. */
const UNPUBLISHED = ["draft", "rejected", "expired", "closed"]

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="bg-card rounded-xl border p-5 sm:p-6">
      <h2 id={`${id}-heading`} className="text-lg font-semibold">
        {title}
      </h2>
      {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

/** All listing data on one page (dashboard). Photos save immediately; everything else on "Save". */
export function ListingEditForm({ initial, emailConfirmed, trusted }: { initial: WizardListing; emailConfirmed: boolean; trusted: boolean }) {
  const t = useTranslations("post")
  const ta = useTranslations("account")
  const ts = useTranslations("account.status")
  const tv = useTranslations("post.validation")
  const tc = useTranslations("common")
  const router = useRouter()
  const form = useListingForm(initial)
  const { listing, setErrors } = form

  const [status, setStatus] = useState(initial.status)
  const [pending, start] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const canPublish = UNPUBLISHED.includes(status)

  const save = (publish: boolean) => {
    const details = validateDetails(listing, form.nums, tv)
    const contact = validateContact(listing, tv)
    const errs: Errors = { ...validateLocation(listing, tv), ...details.errors, ...contact.errors }
    if (publish && listing.photos.length === 0) errs.photos = tv("photos")
    if (publish && !acceptTerms) errs.terms = tv("terms")
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast.error(ta("fixErrors"))
      focusFirstError(errs)
      return
    }

    start(async () => {
      const fail = (res: { ok: false; error: string; field?: string }) => {
        const message = serverErrorMessage(res.error, tv, tc)
        if (res.field) {
          setErrors({ [res.field]: message })
          focusFirstError({ [res.field]: message })
        }
        toast.error(message)
      }

      const loc = await saveLocation(listing.id, locationPayload(listing))
      if (!loc.ok) return fail(loc)
      const det = await saveDetails(listing.id, details.payload)
      if (!det.ok) return fail(det)
      const con = await saveContact(listing.id, contact.payload)
      if (!con.ok) return fail(con)

      let nextStatus = det.data.status
      if (publish) {
        const res = await submitListing(listing.id, { acceptTerms: true })
        if (!res.ok) {
          if (res.error === "email_unconfirmed") toast.error(t("verifyEmailFirst"))
          else fail(res)
          return
        }
        nextStatus = res.data.status
        toast.success(nextStatus === "active" ? t("submittedActive") : t("submittedPending"))
      } else if (status === "active" && nextStatus === "pending") {
        toast.info(ta("backToReview"))
      } else {
        toast.success(ta("changesSaved"))
      }
      setStatus(nextStatus)
      router.refresh()
    })
  }

  const busy = pending || uploading

  return (
    <div className="flex flex-col gap-5 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[status])}>{ts(status as "draft")}</span>
        <span className="text-muted-foreground text-sm">#{listing.id}</span>
        {!["draft", "removed"].includes(status) && (
          <Link
            href={ownerListingPath(listing.id, listing.title, status)}
            className="text-primary ml-auto inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            {ta("viewListing")} <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        )}
      </div>

      {status === "rejected" && initial.rejection_reason && (
        <p role="status" className="bg-warning-soft text-warning rounded-lg px-4 py-3 text-sm">
          {ta("rejectedReason", { reason: initial.rejection_reason })}
        </p>
      )}

      <Section id="basics" title={t("stepBasics")}>
        <BasicsFields form={form} />
      </Section>
      <Section id="location" title={t("stepLocation")}>
        <LocationFields form={form} />
      </Section>
      <Section id="details" title={t("stepDetails")}>
        <DetailsFields form={form} />
      </Section>
      <Section id="photos" title={t("stepPhotos")} description={ta("photosAutoSaved")}>
        <PhotosField form={form} onBusyChange={setUploading} />
      </Section>
      <Section id="contact" title={ta("sectionContact")}>
        <ContactFields form={form} />
      </Section>
      {canPublish && (
        <PublishTerms trusted={trusted} emailConfirmed={emailConfirmed} accepted={acceptTerms} onAccept={setAcceptTerms} error={form.errors.terms} />
      )}

      {/* Sticky action bar: always reachable on long forms and on mobile. */}
      <div className="bg-background/95 sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <Button asChild variant="ghost" className="mr-auto">
          <Link href="/account/listings">{tc("cancel")}</Link>
        </Button>
        <Button type="button" variant={canPublish ? "outline" : "default"} disabled={busy} onClick={() => save(false)}>
          {busy && !canPublish && <Loader2 className="animate-spin" aria-hidden />}
          {ta("saveChanges")}
        </Button>
        {canPublish && (
          <Button type="button" disabled={busy} onClick={() => save(true)}>
            {busy && <Loader2 className="animate-spin" aria-hidden />}
            {ta("saveAndPublish")}
          </Button>
        )}
      </div>
    </div>
  )
}
