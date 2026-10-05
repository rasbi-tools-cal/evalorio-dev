"use client"

import { Eye, ImageOff, Loader2, Mail, Phone } from "lucide-react"
import Image from "next/image"
import { useFormatter, useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Link, useRouter } from "@/i18n/navigation"
import { deleteListing, renewListing, setListingStatus } from "@/lib/actions/listings"
import { photoUrl } from "@/lib/env"
import { ownerListingPath } from "@/lib/urls"
import { cn } from "@/lib/utils"

export interface MyListing {
  id: number
  status: string
  title: string | null
  operation: string
  property_type: string
  price: number | null
  city: string | null
  cover: string | null
  views: number
  reveals: number
  messages: number
  expiresAt: string | null
  rejectionReason: string | null
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-primary-soft text-primary-soft-foreground",
  pending: "bg-surface-container text-foreground",
  draft: "bg-surface-low text-muted-foreground",
  paused: "bg-surface-low text-muted-foreground",
  rejected: "bg-warning-soft text-warning",
  expired: "bg-warning-soft text-warning",
  closed: "bg-surface-low text-muted-foreground",
  removed: "bg-destructive-soft text-destructive",
}

export function MyListingRow({ listing }: { listing: MyListing }) {
  const t = useTranslations("account")
  const ts = useTranslations("account.status")
  const tt = useTranslations("types")
  const tph = useTranslations("operationPhrase")
  const tc = useTranslations("common")
  const format = useFormatter()
  const router = useRouter()
  const [pending, start] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const title = listing.title || `${tt(listing.property_type as "apartment")} ${tph(listing.operation as "sale")}${listing.city ? ` · ${listing.city}` : ""}`
  const run = (fn: () => Promise<{ ok: boolean }>, success = t("updated")) =>
    start(async () => {
      const res = await fn()
      if (res.ok) {
        toast.success(success)
        router.refresh()
      } else toast.error(tc("genericError"))
    })

  const s = listing.status
  const viewable = !["draft", "removed"].includes(s)

  return (
    <article className="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row">
      <div className="bg-surface-low relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg sm:w-44">
        {listing.cover ? (
          <Image src={photoUrl(listing.cover)} alt="" fill sizes="176px" className="object-cover" />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <ImageOff className="size-6" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[s])}>{ts(s as "draft")}</span>
          <span className="text-muted-foreground text-xs">#{listing.id}</span>
          {listing.expiresAt && s === "active" && (
            <span className="text-muted-foreground text-xs">
              · {t("expiresOn", { date: format.dateTime(new Date(listing.expiresAt), { dateStyle: "medium" }) })}
            </span>
          )}
        </div>
        <h2 className="truncate font-semibold">
          {viewable ? (
            <Link href={ownerListingPath(listing.id, listing.title, s)} className="hover:text-primary">
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {listing.price != null && (
          <p className="font-heading font-semibold">
            {format.number(listing.price, "price")}
            {listing.operation === "rent" && <span className="text-muted-foreground text-sm font-normal">{tc("perMonth")}</span>}
          </p>
        )}
        {s === "rejected" && listing.rejectionReason && (
          <p className="bg-warning-soft text-warning rounded-md px-3 py-2 text-sm">{t("rejectedReason", { reason: listing.rejectionReason })}</p>
        )}
        <p className="text-muted-foreground flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden /> {listing.views}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="size-3.5" aria-hidden /> {listing.reveals}
          </span>
          <span className="flex items-center gap-1">
            <Mail className="size-3.5" aria-hidden /> {listing.messages}
          </span>
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {s !== "removed" && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/account/listings/${listing.id}/edit`}>{tc("edit")}</Link>
            </Button>
          )}
          {s === "active" && (
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setListingStatus(listing.id, "paused"))}>
              {t("pause")}
            </Button>
          )}
          {s === "paused" && (
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setListingStatus(listing.id, "active"))}>
              {t("resume")}
            </Button>
          )}
          {(s === "active" || s === "paused") && (
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setListingStatus(listing.id, "closed"))}>
              {t("markClosed")}
            </Button>
          )}
          {s === "expired" && (
            <Button size="sm" disabled={pending} onClick={() => run(() => renewListing(listing.id))}>
              {t("renew")}
            </Button>
          )}
          {(s === "draft" || s === "rejected") && (
            <Button asChild size="sm">
              <Link href={`/account/listings/${listing.id}/edit`}>{t("submit")}</Link>
            </Button>
          )}
          {s === "closed" && (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/account/listings/${listing.id}/edit`}>{t("reopen")}</Link>
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-destructive" disabled={pending} onClick={() => setConfirmDelete(true)}>
            {tc("delete")}
          </Button>
          {pending && <Loader2 className="text-muted-foreground size-4 animate-spin self-center" aria-hidden />}
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc("delete")}</DialogTitle>
            <DialogDescription>{t("confirmDelete")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setConfirmDelete(false)
                run(() => deleteListing(listing.id), t("deleted"))
              }}
            >
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}
