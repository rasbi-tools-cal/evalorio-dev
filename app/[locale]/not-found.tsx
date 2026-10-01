import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export default function NotFound() {
  const t = useTranslations("errors")
  return (
    <div className="page-container flex flex-col items-center py-24 text-center">
      <p className="text-primary font-heading text-6xl font-bold">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground mt-2 max-w-md">{t("notFoundText")}</p>
      <Button asChild className="mt-8">
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </div>
  )
}
