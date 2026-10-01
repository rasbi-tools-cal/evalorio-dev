"use client"

import { Flag, Loader2, Share2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { captchaEnabled, Turnstile, type TurnstileHandle } from "@/components/security/turnstile"
import { reportListing } from "@/lib/actions/contact"
import { REPORT_REASONS, type ReportReason } from "@/lib/catalog"

export function ShareButton({ title }: { title: string }) {
  const tc = useTranslations("common")
  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // cancelled: fall back to copy
      }
    }
    await navigator.clipboard.writeText(url)
    toast.success(tc("linkCopied"))
  }
  return (
    <button
      type="button"
      onClick={share}
      className="bg-surface-low hover:bg-surface-container inline-flex h-10 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-semibold"
    >
      <Share2 className="size-4" aria-hidden />
      {tc("share")}
    </button>
  )
}

export function ReportDialog({ listingId }: { listingId: number }) {
  const t = useTranslations("report")
  const tc = useTranslations("common")
  const captcha = useRef<TurnstileHandle>(null)
  const [token, setToken] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-destructive inline-flex cursor-pointer items-center gap-2 text-sm">
          <Flag className="size-4" aria-hidden />
          {t("title")}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        {done ? (
          <p role="status" className="bg-primary-soft rounded-lg p-4 text-sm">
            {t("thanks")}
          </p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              const form = new FormData(e.currentTarget)
              start(async () => {
                const res = await reportListing({
                  listingId,
                  reason: String(form.get("reason")) as ReportReason,
                  details: String(form.get("details") ?? ""),
                  email: String(form.get("email") ?? ""),
                  captchaToken: token ?? undefined,
                })
                if (res.ok) setDone(true)
                else {
                  captcha.current?.reset()
                  setError(res.error === "rate_limited" ? tc("rateLimited") : res.error === "captcha" ? tc("captchaFailed") : tc("genericError"))
                }
              })
            }}
          >
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <Field label={t("reason")} htmlFor="reason">
              <NativeSelect id="reason" name="reason" required defaultValue="">
                <option value="" disabled>
                  —
                </option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {t(`reasons.${r}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t("details")} htmlFor="details" optionalLabel={tc("optional")}>
              <Textarea id="details" name="details" maxLength={1000} rows={3} placeholder={t("detailsPlaceholder")} />
            </Field>
            <Field label={t("email")} htmlFor="report-email">
              <Input id="report-email" name="email" type="email" maxLength={254} autoComplete="email" />
            </Field>
            <Turnstile ref={captcha} onToken={setToken} action="report" />
            <Button type="submit" disabled={pending || (captchaEnabled && !token)}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {t("submit")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
