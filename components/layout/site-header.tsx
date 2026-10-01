import { Plus } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { COUNTRY_CODES } from "@/lib/catalog"
import { searchPath } from "@/lib/urls"
import { BrowseMenu } from "./browse-menu"
import { LanguageSwitcher } from "./language-switcher"
import { MobileMenu } from "./mobile-menu"
import { UserMenu } from "./user-menu"

export async function SiteHeader() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations("nav")
  const tc = await getTranslations("countries")

  const browse = (operation: "sale" | "rent") =>
    COUNTRY_CODES.map((code) => ({
      label: tc(code),
      href: searchPath(locale, { country: code, category: "homes", operation }),
    }))

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="page-container flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-foreground flex items-center" aria-label="Evalorio">
            <Logo className="h-[19px] w-auto lg:h-[22px]" />
          </Link>
          <nav aria-label={t("mainNavigation")} className="hidden items-center gap-1 md:flex">
            <BrowseMenu label={t("buy")} items={browse("sale")} />
            <BrowseMenu label={t("rent")} items={browse("rent")} />
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden md:flex" />
          <UserMenu />
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/post">
              <Plus aria-hidden />
              {t("listForFree")}
            </Link>
          </Button>
          <MobileMenu buy={browse("sale")} rent={browse("rent")} />
        </div>
      </div>
    </header>
  )
}
