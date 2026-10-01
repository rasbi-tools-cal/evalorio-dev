import "server-only"
import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

export async function clientIp() {
  const h = await headers()
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0"
}

/** Salted hash so abuse logs never store raw IP addresses (GDPR). */
export function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${process.env.IP_HASH_SALT ?? ""}:${ip}`)
    .digest("hex")
    .slice(0, 32)
}

/** Fixed-window limiter backed by Postgres. Returns false when the caller is over the limit. */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error("rate limit check failed", error.message)
    return false // fail closed
  }
  return data === true
}

export async function verifyTurnstile(token: string | null | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === "production") return false
    return true // local dev without keys configured
  }
  if (!token) return false
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      cache: "no-store",
    })
    const json = (await res.json()) as { success: boolean }
    return json.success === true
  } catch {
    return false
  }
}

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|lighthouse|headless/i

export async function isLikelyBot() {
  const ua = (await headers()).get("user-agent") ?? ""
  return !ua || BOT_UA.test(ua)
}
