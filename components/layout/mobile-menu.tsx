"use client"

import { Menu, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Link } from "@/i18n/navigation"
import { LanguageSwitcher } from "./language-switcher"
import { useSessionUser } from "./user-menu"

type Item = { label: string; href: string }

export function MobileMenu({ buy, rent }: { buy: Item[]; rent: Item[] }) {
  const t = useTranslations("nav")
  const tc = useTranslations("common")
  const [open, setOpen] = useState(false)
  const { user } = useSessionUser()
  const close = () => setOpen(false)

  const section = (title: string, items: Item[]) => (
    <div>
      <p className="text-muted-foreground px-3 pb-1 text-xs font-semibold tracking-wider uppercase">{title}</p>
      <ul>
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} onClick={close} className="hover:bg-surface-low block rounded-md px-3 py-2.5">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("menu")}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent title={t("menu")} closeLabel={tc("close")}>
        <div className="flex flex-col gap-6 p-4">
          <Button asChild size="lg">
            <Link href="/post" onClick={close}>
              <Plus aria-hidden /> {t("listForFree")}
            </Link>
          </Button>
          {!user && (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <Link href="/login" onClick={close}>{t("login")}</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/signup" onClick={close}>{t("signup")}</Link>
              </Button>
            </div>
          )}
          {section(t("buy"), buy)}
          {section(t("rent"), rent)}
          <div>
            <p className="text-muted-foreground px-3 pb-1 text-xs font-semibold tracking-wider uppercase">
              {t("language")}
            </p>
            <LanguageSwitcher variant="list" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
