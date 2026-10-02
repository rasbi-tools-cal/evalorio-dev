import { getLocale, getTranslations } from "next-intl/server"
import { CookieSettingsButton } from "@/components/consent/consent-ui"
import { Logo } from "@/components/brand/logo"
import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { COUNTRY_CODES } from "@/lib/catalog"
import { countryPath, searchPath } from "@/lib/urls"

export async function SiteFooter() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations("footer")
  const tc = await getTranslations("countries")
  const tn = await getTranslations("nav")

  const linkClass = "text-subtle-foreground hover:text-primary text-sm transition-colors"

  return (
    <footer className="bg-surface border-t">
      <div className="page-container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo className="text-foreground h-6 w-auto" />
            <p className="text-muted-foreground mt-3 text-sm">{t("tagline")}</p>
          </div>
          <nav aria-label={t("explore")} className="flex flex-col gap-2">
            <h2 className="mb-1 text-xs font-semibold tracking-wider uppercase">{t("explore")}</h2>
            {COUNTRY_CODES.map((code) => (
              <Link key={code} href={countryPath(locale, code)} className={linkClass}>
                {tc(code)}
              </Link>
            ))}
          </nav>
          <nav aria-label={t("owners")} className="flex flex-col gap-2">
            <h2 className="mb-1 text-xs font-semibold tracking-wider uppercase">{t("owners")}</h2>
            <Link href="/post" className={linkClass}>
              {t("postListing")}
            </Link>
            <Link href="/how-it-works" className={linkClass}>
              {t("howItWorks")}
            </Link>
            <Link href={searchPath(locale, { country: "ES", category: "homes", operation: "rent" })} className={linkClass}>
              {tn("rent")} · {tc("ES")}
            </Link>
          </nav>
          <nav aria-label={t("company")} className="flex flex-col gap-2">
            <h2 className="mb-1 text-xs font-semibold tracking-wider uppercase">{t("company")}</h2>
            <Link href="/about" className={linkClass}>
              {t("about")}
            </Link>
            <Link href="/blog" className={linkClass}>
              {t("blog")}
            </Link>
            <Link href="/contact" className={linkClass}>
              {t("contact")}
            </Link>
          </nav>
          <nav aria-label={t("legal")} className="flex flex-col gap-2">
            <h2 className="mb-1 text-xs font-semibold tracking-wider uppercase">{t("legal")}</h2>
            <Link href="/terms" className={linkClass}>
              {t("terms")}
            </Link>
            <Link href="/privacy" className={linkClass}>
              {t("privacy")}
            </Link>
            <Link href="/cookies" className={linkClass}>
              {t("cookies")}
            </Link>
            <CookieSettingsButton className={linkClass} />
            <Link href="/legal-notice" className={linkClass}>
              {t("legalNotice")}
            </Link>
            <Link href="/privacy/request" className={linkClass}>
              {t("privacyRequest")}
            </Link>
          </nav>
        </div>
        <div className="text-muted-foreground mt-10 flex flex-col gap-2 border-t pt-6 text-xs sm:flex-row sm:justify-between">
          <p>{t("rights", { year: new Date().getFullYear() })}</p>
          <p>
            <a href="https://www.geonames.org/" className="hover:text-primary" rel="noopener">
              {t("geonames")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
