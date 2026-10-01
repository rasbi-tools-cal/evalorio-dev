"use client"

import { Check, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Link, useRouter } from "@/i18n/navigation"
import { createDraft, saveContact, saveDetails, saveLocation, submitListing } from "@/lib/actions/listings"
import { PROPERTY_TYPES, type Operation, type PropertyType } from "@/lib/catalog"
import { STEPS, type Step, type WizardListing } from "@/lib/listings/wizard"
import { listingPath } from "@/lib/urls"
import { cn } from "@/lib/utils"
import {
  BasicsFields,
  ChoiceGroup,
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
} from "./listing-fields"

function StepIndicator({ step, onJump, canJump }: { step: Step; onJump: (s: Step) => void; canJump: boolean }) {
  const t = useTranslations("post")
  const labels: Record<Step, string> = {
    basics: t("stepBasics"),
    location: t("stepLocation"),
    details: t("stepDetails"),
    photos: t("stepPhotos"),
    publish: t("stepContact"),
  }
  const current = STEPS.indexOf(step)
  return (
    <nav aria-label={t("stepOf", { current: current + 1, total: STEPS.length })} className="mb-8">
      <p className="text-muted-foreground mb-3 text-sm sm:hidden">
        {t("stepOf", { current: current + 1, total: STEPS.length })} · <strong className="text-foreground">{labels[step]}</strong>
      </p>
      <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {STEPS.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={s}>
              <button
                type="button"
                disabled={!canJump || i > current}
                onClick={() => onJump(s)}
                aria-current={active ? "step" : undefined}
                className={cn("flex w-full flex-col gap-2 text-left disabled:cursor-default", canJump && i <= current && "cursor-pointer")}
              >
                <span className={cn("h-1.5 rounded-full", done || active ? "bg-primary" : "bg-surface-container")} />
                <span
                  className={cn(
                    "hidden items-center gap-1.5 text-xs font-semibold sm:flex",
                    active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {done && <Check className="size-3.5" aria-hidden />}
                  {labels[s]}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** New listing: only the first step, which creates the draft. */
export function NewListingStart() {
  const t = useTranslations("post")
  const tt = useTranslations("types")
  const tc = useTranslations("common")
  const router = useRouter()
  const [operation, setOperation] = useState<Operation | null>(null)
  const [type, setType] = useState<PropertyType | null>(null)
  const [pending, start] = useTransition()

  return (
    <div className="flex flex-col gap-8">
      <StepIndicator step="basics" onJump={() => {}} canJump={false} />
      <ChoiceGroup
        name="operation"
        label={t("operationQuestion")}
        value={operation}
        onChange={setOperation}
        columns="grid-cols-2"
        options={[
          { value: "sale", label: t("sell") },
          { value: "rent", label: t("rentOut") },
        ]}
      />
      <ChoiceGroup
        name="type"
        label={t("typeQuestion")}
        value={type}
        onChange={setType}
        options={PROPERTY_TYPES.filter((p) => !(operation === "sale" && p === "room")).map((p) => ({ value: p, label: tt(p) }))}
      />
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!operation || !type || pending}
          onClick={() =>
            start(async () => {
              const res = await createDraft({ operation: operation!, property_type: type! })
              if (res.ok) router.replace(`/post/${res.data.id}?step=location`)
              else toast.error(res.error === "rate_limited" ? tc("rateLimited") : tc("genericError"))
            })
          }
        >
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {tc("continue")}
        </Button>
      </div>
    </div>
  )
}

/** Step-by-step flow for finishing and publishing a new listing (drafts). */
export function PostWizard({
  initial,
  initialStep,
  emailConfirmed,
  trusted,
}: {
  initial: WizardListing
  initialStep: Step
  emailConfirmed: boolean
  trusted: boolean
}) {
  const t = useTranslations("post")
  const tv = useTranslations("post.validation")
  const tc = useTranslations("common")
  const form = useListingForm(initial)
  const { listing, setErrors } = form

  const [step, setStep] = useState<Step>(initialStep)
  const [pending, start] = useTransition()
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("step", step)
    window.history.replaceState(window.history.state, "", url)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const goto = (s: Step) => {
    setErrors({})
    setStep(s)
  }
  const next = () => goto(STEPS[STEPS.indexOf(step) + 1])
  const back = () => goto(STEPS[STEPS.indexOf(step) - 1])

  const fail = (res: { ok: false; error: string; field?: string }) => {
    const message = serverErrorMessage(res.error, tv, tc)
    if (res.field) setErrors({ [res.field]: message })
    else toast.error(message)
  }
  const guard = (errs: Record<string, string | undefined>) => {
    setErrors(errs)
    focusFirstError(errs)
    return Object.keys(errs).length === 0
  }

  const handlers: Record<Step, () => void> = {
    basics: () =>
      start(async () => {
        const res = await saveDetails(listing.id, { operation: listing.operation, property_type: listing.property_type })
        if (res.ok) next()
        else fail(res)
      }),
    location: () => {
      if (!guard(validateLocation(listing, tv))) return
      start(async () => {
        const res = await saveLocation(listing.id, locationPayload(listing))
        if (res.ok) next()
        else fail(res)
      })
    },
    details: () => {
      const { errors, payload } = validateDetails(listing, form.nums, tv)
      if (!guard(errors)) return
      start(async () => {
        const res = await saveDetails(listing.id, payload)
        if (res.ok) next()
        else fail(res)
      })
    },
    photos: () => {
      if (!guard(listing.photos.length ? {} : { photos: tv("photos") })) return
      next()
    },
    publish: () => {
      const { errors, payload } = validateContact(listing, tv)
      if (!acceptTerms) errors.terms = tv("terms")
      if (!guard(errors)) return
      start(async () => {
        const contact = await saveContact(listing.id, payload)
        if (!contact.ok) return fail(contact)
        const res = await submitListing(listing.id, { acceptTerms: true })
        if (res.ok) setSubmitted(res.data.status)
        else if (res.error === "email_unconfirmed") toast.error(t("verifyEmailFirst"))
        else fail(res)
      })
    },
  }

  if (submitted) {
    const live = submitted === "active"
    return (
      <div className="flex flex-col items-center py-10 text-center">
        {live ? <CheckCircle2 className="text-primary size-14" aria-hidden /> : <Clock className="text-primary size-14" aria-hidden />}
        <h2 className="mt-4 text-2xl font-bold">{t("submittedTitle")}</h2>
        <p className="text-muted-foreground mt-2 max-w-md">{live ? t("submittedActive") : t("submittedPending")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href={listingPath(listing.id, listing.title)}>{t("viewListing")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account/listings">{t("goToMyListings")}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <StepIndicator step={step} onJump={goto} canJump />

      {initial.status === "rejected" && initial.rejection_reason && (
        <p role="status" className="bg-warning-soft text-warning mb-6 rounded-lg px-4 py-3 text-sm">
          {initial.rejection_reason}
        </p>
      )}

      {step === "basics" && <BasicsFields form={form} />}
      {step === "location" && <LocationFields form={form} />}
      {step === "details" && <DetailsFields form={form} />}
      {step === "photos" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t("photosTitle")}</h2>
          <PhotosField form={form} onBusyChange={setUploading} />
        </div>
      )}
      {step === "publish" && (
        <div className="flex flex-col gap-6">
          <ContactFields form={form} />
          <PublishTerms trusted={trusted} emailConfirmed={emailConfirmed} accepted={acceptTerms} onAccept={setAcceptTerms} error={form.errors.terms} />
        </div>
      )}

      <div className="mt-10 flex items-center justify-between gap-3 border-t pt-6">
        {step !== "basics" ? (
          <Button type="button" variant="ghost" onClick={back} disabled={pending}>
            {tc("back")}
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" size="lg" onClick={handlers[step]} disabled={pending || uploading}>
          {(pending || uploading) && <Loader2 className="animate-spin" aria-hidden />}
          {step === "publish" ? t("publish") : tc("continue")}
        </Button>
      </div>
    </div>
  )
}
