"use server"

import { getLocale } from "next-intl/server"
import { z } from "zod"
import { SITE_URL } from "@/lib/env"
import { clientIp, hashIp, rateLimit } from "@/lib/security"
import { createClient } from "@/lib/supabase/server"
import { safeNextPath } from "@/lib/urls"

export type AuthResult =
  | { ok: true; next?: string; email?: string; signedIn?: boolean }
  | { ok: false; error: "invalid_credentials" | "email_not_confirmed" | "weak_password" | "email_taken" | "captcha" | "rate_limited" | "generic" }

const email = z.string().trim().toLowerCase().email().max(254)
const password = z.string().min(8).max(72).regex(/[a-zA-Z]/).regex(/\d/)

function mapError(message: string | undefined): AuthResult {
  const m = (message ?? "").toLowerCase()
  if (m.includes("invalid login")) return { ok: false, error: "invalid_credentials" }
  if (m.includes("not confirmed")) return { ok: false, error: "email_not_confirmed" }
  if (m.includes("captcha")) return { ok: false, error: "captcha" }
  if (m.includes("password")) return { ok: false, error: "weak_password" }
  if (m.includes("already registered") || m.includes("already exists")) return { ok: false, error: "email_taken" }
  if (m.includes("rate limit") || m.includes("too many")) return { ok: false, error: "rate_limited" }
  return { ok: false, error: "generic" }
}

async function limited(action: string) {
  const ip = hashIp(await clientIp())
  return !(await rateLimit(`auth:${action}:${ip}`, 20, 15 * 60))
}

function confirmUrl(next: string) {
  return `${SITE_URL}/api/auth/confirm?next=${encodeURIComponent(next)}`
}

export async function signIn(input: { email: string; password: string; captchaToken?: string; next?: string }): Promise<AuthResult> {
  const parsed = z.object({ email, password: z.string().min(1).max(72) }).safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_credentials" }
  if (await limited("signin")) return { ok: false, error: "rate_limited" }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    ...parsed.data,
    options: { captchaToken: input.captchaToken },
  })
  if (error) return mapError(error.message)
  return { ok: true, next: safeNextPath(input.next, "/account/listings") }
}

export async function signUp(input: {
  email: string
  password: string
  displayName: string
  captchaToken?: string
  next?: string
}): Promise<AuthResult> {
  const parsed = z
    .object({ email, password, displayName: z.string().trim().min(2).max(60) })
    .safeParse(input)
  if (!parsed.success) {
    const weak = parsed.error.issues.some((i) => i.path[0] === "password")
    return { ok: false, error: weak ? "weak_password" : "generic" }
  }
  if (await limited("signup")) return { ok: false, error: "rate_limited" }

  const locale = await getLocale()
  const supabase = await createClient()
  const next = safeNextPath(input.next, "/account/listings")
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      captchaToken: input.captchaToken,
      emailRedirectTo: confirmUrl(next),
      data: { display_name: parsed.data.displayName, locale },
    },
  })
  if (error) return mapError(error.message)
  // Supabase returns a user with no identities when the email already exists (anti-enumeration).
  if (data.user && data.user.identities?.length === 0) return { ok: false, error: "email_taken" }
  // With email confirmation off (Supabase "autoconfirm"), sign-up returns a session: the user is in.
  return { ok: true, email: parsed.data.email, next, signedIn: Boolean(data.session) }
}

export async function requestPasswordReset(input: { email: string; captchaToken?: string }): Promise<AuthResult> {
  const parsed = email.safeParse(input.email)
  // Same answer whether or not the account exists.
  if (!parsed.success) return { ok: true }
  if (await limited("reset")) return { ok: false, error: "rate_limited" }

  const locale = await getLocale()
  const next = locale === "en" ? "/reset-password" : `/${locale}/reset-password`
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: confirmUrl(next),
    captchaToken: input.captchaToken,
  })
  if (error && error.message.toLowerCase().includes("captcha")) return { ok: false, error: "captcha" }
  return { ok: true }
}

export async function updatePassword(input: { password: string }): Promise<AuthResult> {
  const parsed = password.safeParse(input.password)
  if (!parsed.success) return { ok: false, error: "weak_password" }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data })
  if (error) return mapError(error.message)
  return { ok: true }
}

export async function signInWithGoogle(next?: string): Promise<{ url: string | null }> {
  const supabase = await createClient()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${SITE_URL}/api/auth/callback?next=${encodeURIComponent(safeNextPath(next, "/account/listings"))}`,
    },
  })
  return { url: data.url }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
