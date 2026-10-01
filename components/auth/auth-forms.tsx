"use client"

import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { captchaEnabled, Turnstile, type TurnstileHandle } from "@/components/security/turnstile"
import { Link, useRouter } from "@/i18n/navigation"
import {
  requestPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
  type AuthResult,
} from "@/lib/actions/auth"
import { notifyAuthChanged } from "@/lib/auth-events"

function useAuthError() {
  const t = useTranslations("auth")
  const tc = useTranslations("common")
  return (result: AuthResult) => {
    if (result.ok) return null
    switch (result.error) {
      case "invalid_credentials":
        return t("invalidCredentials")
      case "email_not_confirmed":
        return t("emailNotConfirmed")
      case "weak_password":
        return t("weakPassword")
      case "email_taken":
        return t("emailTaken")
      case "captcha":
        return tc("captchaFailed")
      case "rate_limited":
        return tc("rateLimited")
      default:
        return tc("genericError")
    }
  }
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="bg-destructive-soft text-destructive rounded-md px-3 py-2.5 text-sm">
      {message}
    </p>
  )
}

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"

function GoogleButton({ next }: { next?: string }) {
  const t = useTranslations("auth")
  const tc = useTranslations("common")
  const [pending, start] = useTransition()
  if (!GOOGLE_ENABLED) return null
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const { url } = await signInWithGoogle(next)
            if (url) window.location.href = url
          })
        }
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        {t("continueWithGoogle")}
      </Button>
      <div className="text-muted-foreground flex items-center gap-3 text-xs uppercase">
        <span className="h-px flex-1 bg-border" />
        {tc("or")}
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  )
}

function SubmitButton({ pending, disabled, children }: { pending: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" size="lg" disabled={pending || disabled}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  )
}

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const t = useTranslations("auth")
  const router = useRouter()
  const toMessage = useAuthError()
  const captcha = useRef<TurnstileHandle>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [pending, start] = useTransition()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    start(async () => {
      const result = await signIn({
        email: String(form.get("email")),
        password: String(form.get("password")),
        captchaToken: token ?? undefined,
        next,
      })
      if (result.ok) {
        notifyAuthChanged()
        router.replace(result.next ?? "/account/listings")
        router.refresh()
      } else {
        setError(toMessage(result))
        captcha.current?.reset()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton next={next} />
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate={false}>
        <FormError message={error} />
        <Field label={t("email")} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </Field>
        <Field label={t("password")} htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required maxLength={72} />
        </Field>
        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="text-primary text-sm font-medium hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
        <Turnstile ref={captcha} onToken={setToken} action="login" />
        <SubmitButton pending={pending} disabled={captchaEnabled && !token}>
          {t("loginButton")}
        </SubmitButton>
      </form>
      <p className="text-muted-foreground text-center text-sm">
        {t("noAccount")}{" "}
        <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="text-primary font-semibold hover:underline">
          {t("signupButton")}
        </Link>
      </p>
    </div>
  )
}

export function SignupForm({ next }: { next?: string }) {
  const t = useTranslations("auth")
  const toMessage = useAuthError()
  const captcha = useRef<TurnstileHandle>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (sentTo) {
    return (
      <div role="status" className="bg-primary-soft rounded-lg p-5">
        <h2 className="text-lg font-semibold">{t("checkEmailTitle")}</h2>
        <p className="text-subtle-foreground mt-1 text-sm">{t("checkEmailText", { email: sentTo })}</p>
      </div>
    )
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    start(async () => {
      const result = await signUp({
        email: String(form.get("email")),
        password: String(form.get("password")),
        displayName: String(form.get("displayName")),
        captchaToken: token ?? undefined,
        next,
      })
      if (result.ok) setSentTo(result.email ?? "")
      else {
        setError(toMessage(result))
        captcha.current?.reset()
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton next={next} />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormError message={error} />
        <Field label={t("displayName")} htmlFor="displayName">
          <Input id="displayName" name="displayName" autoComplete="name" required minLength={2} maxLength={60} />
        </Field>
        <Field label={t("email")} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </Field>
        <Field label={t("password")} htmlFor="password" help={t("passwordHelp")}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
            aria-describedby="password-help"
          />
        </Field>
        <Turnstile ref={captcha} onToken={setToken} action="signup" />
        <SubmitButton pending={pending} disabled={captchaEnabled && !token}>
          {t("signupButton")}
        </SubmitButton>
        <p className="text-muted-foreground text-xs">
          {t.rich("termsNotice", {
            terms: (chunks) => (
              <Link href="/terms" className="underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </form>
      <p className="text-muted-foreground text-center text-sm">
        {t("haveAccount")}{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-primary font-semibold hover:underline">
          {t("loginButton")}
        </Link>
      </p>
    </div>
  )
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth")
  const toMessage = useAuthError()
  const captcha = useRef<TurnstileHandle>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, start] = useTransition()

  if (sent) {
    return (
      <p role="status" className="bg-primary-soft rounded-lg p-4 text-sm">
        {t("resetSent")}
      </p>
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const email = String(new FormData(e.currentTarget).get("email"))
        start(async () => {
          const result = await requestPasswordReset({ email, captchaToken: token ?? undefined })
          if (result.ok) setSent(true)
          else {
            setError(toMessage(result))
            captcha.current?.reset()
          }
        })
      }}
    >
      <FormError message={error} />
      <Field label={t("email")} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Turnstile ref={captcha} onToken={setToken} action="reset" />
      <SubmitButton pending={pending} disabled={captchaEnabled && !token}>
        {t("resetButton")}
      </SubmitButton>
    </form>
  )
}

export function NewPasswordForm() {
  const t = useTranslations("auth")
  const toMessage = useAuthError()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, start] = useTransition()

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="bg-primary-soft rounded-lg p-4 text-sm">{t("passwordUpdated")}</p>
        <Button onClick={() => router.push("/account/listings")}>{t("loginButton")}</Button>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        const password = String(new FormData(e.currentTarget).get("password"))
        start(async () => {
          const result = await updatePassword({ password })
          if (result.ok) setDone(true)
          else setError(toMessage(result))
        })
      }}
    >
      <FormError message={error} />
      <Field label={t("newPassword")} htmlFor="password" help={t("passwordHelp")}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          aria-describedby="password-help"
        />
      </Field>
      <SubmitButton pending={pending}>{t("updatePassword")}</SubmitButton>
    </form>
  )
}
