import { NextResponse, type NextRequest } from "next/server"
import { routing } from "@/i18n/routing"
import { AUTH_COOKIE_NAME } from "@/lib/env"
import { refreshSession } from "@/lib/supabase/middleware"
import { safeNextPath } from "@/lib/urls"

// Language routing is done by redirects/rewrites in next.config.mjs (no function call). This proxy
// only runs where a session matters (see `config.matcher`): for visitors carrying a session cookie,
// and on the private sections so anonymous visitors get sent to the login page.

const PROTECTED = [/^\/account(\/|$)/, /^\/post(\/|$)/, /^\/admin(\/|$)/, /^\/preview(\/|$)/]
const GUEST_ONLY = [/^\/login\/?$/, /^\/signup\/?$/]
const localePrefix = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`)

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  const { pathname, search } = request.nextUrl
  const localeMatch = pathname.match(localePrefix)
  const prefix = localeMatch ? localeMatch[0] : ""
  const pathWithoutLocale = localeMatch ? pathname.slice(prefix.length) || "/" : pathname

  // Anonymous visitor on a private page: nothing to refresh, skip the call to Supabase Auth.
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith(AUTH_COOKIE_NAME))
  const user = hasSession ? await refreshSession(request, response) : null

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

/** Keep refreshed session cookies on a redirect. */
function withCookies(redirect: NextResponse, response: NextResponse) {
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}

// Page routes only (no api, Next/Vercel internals or files). Matchers must be literals: the cookie
// names are AUTH_COOKIE_NAME from lib/env.ts ("evalorio_session", ".0" when @supabase/ssr chunks it).
export const config = {
  matcher: [
    { source: "/((?!api|_next|_vercel|.*\\..*).*)", has: [{ type: "cookie", key: "evalorio_session" }] },
    { source: "/((?!api|_next|_vercel|.*\\..*).*)", has: [{ type: "cookie", key: "evalorio_session.0" }] },
    "/:locale(es|fr|it|pt)?/(account|post|admin|preview)/:path*",
  ],
}
