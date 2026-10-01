"use client"

import { Loader2, Phone, ShieldCheck } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { captchaEnabled, Turnstile, type TurnstileHandle } from "@/components/security/turnstile"
import { useSessionUser } from "@/components/layout/user-menu"
import { Link } from "@/i18n/navigation"
import { revealPhone, sendMessage } from "@/lib/actions/contact"
import { initials } from "@/lib/utils"

export function ContactCard({
  listingId,
  ownerId,
  ownerName,
  memberSince,
  hasPhone,
}: {
  listingId: number
  ownerId: string
  ownerName: string
  memberSince: string | null
  hasPhone: boolean
}) {
  const t = useTranslations("contact")
  const tc = useTranslations("common")
  const tn = useTranslations("nav")
  const format = useFormatter()
  const { user } = useSessionUser()
  const [phone, setPhone] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [revealing, startReveal] = useTransition()

  if (user?.id === ownerId) {
    return (
      <div className="bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-[var(--shadow-card)]">
        <p className="font-semibold">{t("ownListing")}</p>
        <Button asChild variant="outline">
          <Link href={`/account/listings/${listingId}/edit`}>{t("manage")}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/account/listings">{tn("myListings")} →</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card flex flex-col gap-5 rounded-xl border p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary-soft text-primary-soft-foreground flex size-12 items-center justify-center rounded-full font-semibold">
          {initials(ownerName)}
        </div>
        <div>
          <p className="font-semibold">{ownerName}</p>
          <p className="text-muted-foreground text-[13px]">
            {t("privateOwner")}
            {memberSince && ` · ${t("memberSince", { date: format.dateTime(new Date(memberSince), { month: "long", year: "numeric" }) })}`}
          </p>
        </div>
      </div>

      {hasPhone ? (
        phone ? (
          <Button asChild size="lg" variant="outline">
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
              <Phone aria-hidden /> {phone}
            </a>
          </Button>
        ) : (
          <Button
            size="lg"
            variant="outline"
            disabled={revealing}
            onClick={() =>
              startReveal(async () => {
                const res = await revealPhone(listingId)
                if (res.ok && res.phone) setPhone(res.phone)
                else setPhoneError(res.ok ? t("noPhone") : res.error === "rate_limited" ? tc("rateLimited") : tc("genericError"))
              })
            }
          >
            {revealing ? <Loader2 className="animate-spin" aria-hidden /> : <Phone aria-hidden />}
            {t("showPhone")}
          </Button>
        )
      ) : (
        <p className="text-muted-foreground text-sm">{t("noPhone")}</p>
      )}
      {phoneError && (
        <p role="alert" className="text-destructive -mt-3 text-sm">
          {phoneError}
        </p>
      )}

      <MessageForm listingId={listingId} defaultName={(user?.user_metadata?.display_name as string) ?? ""} defaultEmail={user?.email ?? ""} />

      <div className="bg-surface flex gap-3 rounded-lg p-3.5 text-[13px]">
        <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <strong className="font-semibold">{t("safetyTitle")}.</strong> {t("safetyText")}
        </p>
      </div>
    </div>
  )
}

function MessageForm({ listingId, defaultName, defaultEmail }: { listingId: number; defaultName: string; defaultEmail: string }) {
  const t = useTranslations("contact")
  const tc = useTranslations("common")
  const captcha = useRef<TurnstileHandle>(null)
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "sent">("idle")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (status === "sent") {
    return (
      <p role="status" className="bg-primary-soft text-primary-soft-foreground rounded-lg p-4 text-sm font-medium">
        {t("sent")}
      </p>
    )
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        start(async () => {
          const res = await sendMessage({
            listingId,
            name: String(form.get("name")),
            email: String(form.get("email")),
            phone: String(form.get("phone") ?? ""),
            body: String(form.get("body")),
            website: String(form.get("website") ?? ""),
            captchaToken: token ?? undefined,
          })
          if (res.ok) setStatus("sent")
          else {
            captcha.current?.reset()
            setError(
              res.error === "rate_limited"
                ? tc("rateLimited")
                : res.error === "captcha"
                  ? tc("captchaFailed")
                  : res.error === "links"
                    ? t("noLinks")
                    : res.error === "invalid"
                      ? t("invalid")
                      : tc("genericError"),
            )
          }
        })
      }}
    >
      <h2 className="text-base font-semibold">{t("title")}</h2>
      {error && (
        <p role="alert" className="bg-destructive-soft text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Field label={t("message")} htmlFor="body">
        <Textarea id="body" name="body" required minLength={10} maxLength={2000} rows={4} defaultValue={t("messageDefault")} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label={t("name")} htmlFor="name">
          <Input id="name" name="name" required minLength={2} maxLength={60} autoComplete="name" defaultValue={defaultName} />
        </Field>
        <Field label={t("phone")} htmlFor="phone" optionalLabel={tc("optional")}>
          <Input id="phone" name="phone" type="tel" maxLength={20} autoComplete="tel" pattern="\+?[0-9 ()\-]{6,20}" />
        </Field>
      </div>
      <Field label={t("email")} htmlFor="email">
        <Input id="email" name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={defaultEmail} />
      </Field>
      {/* Honeypot, hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Turnstile ref={captcha} onToken={setToken} action="contact" />
      <Button type="submit" size="lg" disabled={pending || (captchaEnabled && !token)}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {pending ? t("sending") : t("send")}
      </Button>
      <p className="text-muted-foreground text-xs">
        {t.rich("consent", {
          privacy: (chunks) => (
            <Link href="/privacy" className="underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  )
}
