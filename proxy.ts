import createIntlMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"
import { routing } from "@/i18n/routing"
import { AUTH_COOKIE_NAME } from "@/lib/env"
import { refreshSession } from "@/lib/supabase/middleware"
import { safeNextPath } from "@/lib/urls"

const handleI18nRouting = createIntlMiddleware(routing)

const PROTECTED = [/^\/account(\/|$)/, /^\/post(\/|$)/, /^\/admin(\/|$)/, /^\/preview(\/|$)/]
const GUEST_ONLY = [/^\/login\/?$/, /^\/signup\/?$/]
const localePrefix = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`)

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request)
  // Redirects issued by next-intl (e.g. /en/... -> /...) don't need a session.
  if (response.headers.get("location")) return response

  // Most visitors are anonymous: without a session cookie there is nothing to refresh, so skip the
  // network call to Supabase Auth and only do the language routing.
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith(AUTH_COOKIE_NAME))

  const { pathname, search } = request.nextUrl
  const localeMatch = pathname.match(localePrefix)
  const prefix = localeMatch ? localeMatch[0] : ""
  const pathWithoutLocale = localeMatch ? pathname.slice(prefix.length) || "/" : pathname

  if (!hasSession) {
    if (PROTECTED.some((re) => re.test(pathWithoutLocale))) return toLogin(request, prefix, pathname + search, response)
    return response
  }

  const user = await refreshSession(request, response)

  if (!user && PROTECTED.some((re) => re.test(pathWithoutLocale))) return toLogin(request, prefix, pathname + search, response)

  // Signed-in users don't need the login/sign-up pages (those pages are static, so this lives here).
  if (user && GUEST_ONLY.some((re) => re.test(pathWithoutLocale))) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"), "/account/listings")
    return withCookies(NextResponse.redirect(new URL(`${prefix}${next}`, request.url)), response)
  }

  return response
}

function toLogin(request: NextRequest, prefix: string, back: string, response: NextResponse) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = `${prefix}/login`
  loginUrl.search = `?next=${encodeURIComponent(back)}`
  return withCookies(NextResponse.redirect(loginUrl), response)
}

/** Keep refreshed session cookies (set on the i18n response) on a redirect. */
function withCookies(redirect: NextResponse, response: NextResponse) {
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}

export const config = {
  // Page routes only: no API routes (incl. the auth callback), no Next internals (_next/static,
  // _next/image), no Vercel internals and no files with an extension (images, favicon, robots.txt,
  // sitemap.xml, manifest...).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
