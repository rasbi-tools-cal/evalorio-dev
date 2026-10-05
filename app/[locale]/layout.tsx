import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Toaster } from "sonner"
import { ConsentProvider } from "@/components/consent/consent-provider"
import { ConsentBanner, ConsentedScripts, ConsentSettingsDialog } from "@/components/consent/consent-ui"
import { FavoritesProvider } from "@/components/listings/favorites-provider"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { routing } from "@/i18n/routing"
import { fontVariables } from "@/lib/fonts"

// Prerender every language: pages without request-time APIs become static (○/●) instead of ƒ.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })
  return {
    title: { default: t("homeTitle"), template: `%s | ${t("siteName")}` },
    description: t("homeDescription"),
    openGraph: { siteName: t("siteName"), type: "website", locale },
    twitter: { card: "summary_large_image" },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const t = await getTranslations("common")

  return (
    <html lang={locale} className={fontVariables}>
      <body className="min-h-dvh">
    <NextIntlClientProvider>
      <ConsentProvider>
      <FavoritesProvider>
      <a
        href="#main"
        className="bg-primary text-primary-foreground sr-only z-[100] rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("skipToContent")}
      </a>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
      <Toaster position="bottom-center" richColors closeButton />
      <ConsentBanner />
      <ConsentSettingsDialog />
      <ConsentedScripts />
      </FavoritesProvider>
      </ConsentProvider>
    </NextIntlClientProvider>
      </body>
    </html>
  )
}
