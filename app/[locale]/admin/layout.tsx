import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { AdminNav } from "@/components/admin/admin-nav"
import { pageLocale } from "@/i18n/locale"
import { getProfile } from "@/lib/supabase/server"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  await pageLocale(params)
  const profile = await getProfile()
  // 404 rather than 403: don't advertise that an admin area exists.
  if (profile?.role !== "admin" || profile.is_banned) notFound()
  const t = await getTranslations("admin")

  return (
    <div className="page-container py-8">
      <h1 className="mb-4 text-2xl font-bold">{t("title")}</h1>
      <AdminNav
        items={[
          { href: "/admin", label: t("queue") },
          { href: "/admin/reports", label: t("reports") },
          { href: "/admin/users", label: t("users") },
          { href: "/admin/log", label: t("log") },
        ]}
      />
      <div className="mt-6">{children}</div>
    </div>
  )
}
