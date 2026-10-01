import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AccountNav } from "@/components/account/account-nav"
import { pageLocale } from "@/i18n/locale"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AccountLayout({ children, params }: LayoutProps<"/[locale]/account">) {
  await pageLocale(params)
  const t = await getTranslations("nav")
  const items = [
    { href: "/account/listings", label: t("myListings"), icon: "home" },
    { href: "/account/favorites", label: t("favorites"), icon: "heart" },
    { href: "/account/searches", label: t("savedSearches"), icon: "bell" },
    { href: "/account/messages", label: t("messages"), icon: "mail" },
    { href: "/account/settings", label: t("settings"), icon: "settings" },
  ] as const

  return (
    <div className="page-container flex flex-col gap-6 py-8 lg:flex-row lg:gap-10">
      <aside className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0 lg:self-start">
        <AccountNav items={[...items]} label={t("account")} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
