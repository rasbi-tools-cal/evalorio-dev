import createIntlMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"
import { routing } from "@/i18n/routing"
import { refreshSession } from "@/lib/supabase/middleware"

const handleI18nRouting = createIntlMiddleware(routing)

const PROTECTED = [/^\/account(\/|$)/, /^\/post(\/|$)/, /^\/admin(\/|$)/]
const localePrefix = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`)

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request)
  // Redirects issued by next-intl (e.g. /en/... -> /...) don't need a session.
  if (response.headers.get("location")) return response

  const user = await refreshSession(request, response)

  const { pathname, search } = request.nextUrl
  const localeMatch = pathname.match(localePrefix)
  const pathWithoutLocale = localeMatch ? pathname.slice(localeMatch[0].length) || "/" : pathname

  if (!user && PROTECTED.some((re) => re.test(pathWithoutLocale))) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = `${localeMatch ? localeMatch[0] : ""}/login`
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`
    const redirect = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  return response
}

export const config = {
  // Everything except API routes (incl. the auth callback), Next internals and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
