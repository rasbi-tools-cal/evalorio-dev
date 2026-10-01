"use client"

import { Loader2, Mail, Phone } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { useSessionUser } from "@/components/layout/user-menu"
import { MessageForm } from "@/components/listing/contact-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { revealPhone } from "@/lib/actions/contact"
import { FavoriteButton } from "./favorite-button"

/**
 * Bottom row of a result card. "View phone" goes through the same rate-limited server action as the
 * listing page, which also records the reveal for the owner's statistics.
 */
export function CardActions({ listingId, title, hasPhone }: { listingId: number; title: string; hasPhone: boolean }) {
  const t = useTranslations("card")
  const tc = useTranslations("common")
  const tContact = useTranslations("contact")
  const { user } = useSessionUser()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const reveal = () =>
    start(async () => {
      const res = await revealPhone(listingId)
      if (res.ok && res.phone) setPhone(res.phone)
      else toast.error(res.ok ? tContact("noPhone") : res.error === "rate_limited" ? tc("rateLimited") : tc("genericError"))
    })

  return (
    <div className="relative z-10 flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Mail aria-hidden />
        {t("contact")}
      </Button>
      {hasPhone &&
        (phone ? (
          <Button asChild size="sm" variant="outline">
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
              <Phone aria-hidden />
              {phone}
            </a>
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={reveal} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Phone aria-hidden />}
            {t("viewPhone")}
          </Button>
        ))}
      <FavoriteButton listingId={listingId} className="ml-auto shadow-none ring-1 ring-border" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="line-clamp-2 pr-6">{title}</DialogTitle>
          </DialogHeader>
          {open && (
            <MessageForm
              listingId={listingId}
              defaultName={(user?.user_metadata?.display_name as string) ?? ""}
              defaultEmail={user?.email ?? ""}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
