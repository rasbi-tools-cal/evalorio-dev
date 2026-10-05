"use client"

import { CheckCircle2, Loader2 } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useEffect, useRef, useState, useTransition } from "react"
import { captchaEnabled, Turnstile, type TurnstileHandle } from "@/components/security/turnstile"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { submitPrivacyRequest } from "@/lib/actions/privacy"
import { createClient } from "@/lib/supabase/client"

const TYPES = ["access", "rectification", "erasure", "restriction", "portability", "objection", "withdraw_consent", "other"] as const

export function PrivacyRequestForm() {
  const t = useTranslations("privacyRequest")
  const tc = useTranslations("common")
  const format = useFormatter()
  const captcha = useRef<TurnstileHandle>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ reference: string; dueAt: string; email: string } | null>(null)
  const [pending, start] = useTransition()
  const emailRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // Signed-in users: prefill email and name in the browser (keeps the page static).
  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      if (emailRef.current && !emailRef.current.value && user.email) emailRef.current.value = user.email
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      if (nameRef.current && !nameRef.current.value && profile?.display_name) nameRef.current.value = profile.display_name
    })
  }, [])

  if (done) {
    return (
      <div role="status" className="bg-primary-soft rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CheckCircle2 className="text-primary size-5" aria-hidden /> {t("sentTitle")}
        </h2>
        <p className="text-subtle-foreground mt-2">
          {t("sentText", { reference: done.reference, email: done.email, date: format.dateTime(new Date(done.dueAt), { dateStyle: "long" }) })}
        </p>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        start(async () => {
          const res = await submitPrivacyRequest({
            type: String(form.get("type")) as (typeof TYPES)[number],
            email: String(form.get("email")),
            name: String(form.get("name") ?? ""),
            details: String(form.get("details") ?? ""),
            captchaToken: token ?? undefined,
          })
          if (res.ok) setDone(res)
          else {
            captcha.current?.reset()
            setError(res.error === "rate_limited" ? tc("rateLimited") : res.error === "captcha" ? tc("captchaFailed") : tc("genericError"))
          }
        })
      }}
    >
      {error && (
        <p role="alert" className="bg-destructive-soft text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Field label={t("type")} htmlFor="type">
        <NativeSelect id="type" name="type" required defaultValue="access">
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`types.${type}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("email")} htmlFor="email">
          <Input ref={emailRef} id="email" name="email" type="email" required maxLength={254} autoComplete="email" />
        </Field>
        <Field label={t("name")} htmlFor="name" optionalLabel={tc("optional")}>
          <Input ref={nameRef} id="name" name="name" maxLength={100} autoComplete="name" />
        </Field>
      </div>
      <Field label={t("details")} htmlFor="details" help={t("detailsHelp")} optionalLabel={tc("optional")}>
        <Textarea id="details" name="details" maxLength={3000} rows={5} aria-describedby="details-help" />
      </Field>
      <p className="text-muted-foreground text-xs">{t("notice")}</p>
      <Turnstile ref={captcha} onToken={setToken} action="privacy" />
      <div>
        <Button type="submit" size="lg" disabled={pending || (captchaEnabled && !token)}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {t("submit")}
        </Button>
      </div>
    </form>
  )
}
