import { redirect } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"

export default async function AccountIndex({ params }: PageProps<"/[locale]/account">) {
  const locale = await pageLocale(params)
  redirect({ href: "/account/listings", locale })
}
