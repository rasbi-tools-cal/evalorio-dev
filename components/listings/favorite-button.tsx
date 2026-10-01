"use client"

import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { toast } from "sonner"
import { usePathname, useRouter } from "@/i18n/navigation"
import { setFavorite } from "@/lib/actions/favorites"
import { cn } from "@/lib/utils"
import { useFavorites } from "./favorites-provider"

export function FavoriteButton({
  listingId,
  variant = "overlay",
  className,
}: {
  listingId: number
  variant?: "overlay" | "button"
  className?: string
}) {
  const t = useTranslations("card")
  const tf = useTranslations("favorites")
  const tc = useTranslations("common")
  const { ids, loggedIn, ready, set } = useFavorites()
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const active = ids.has(listingId)

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const toLogin = () => router.push(`/login?next=${encodeURIComponent(pathname)}`)
    if (ready && !loggedIn) return toLogin()
    // Before the session has loaded we still act; the server knows whether the user is signed in.
    const next = !active
    set(listingId, next)
    startTransition(async () => {
      const res = await setFavorite({ listingId, favorite: next })
      if (!res.ok) {
        set(listingId, !next)
        if (res.error === "auth") toLogin()
        else toast.error(tc("genericError"))
      } else {
        toast.success(next ? tf("added") : tf("removed"))
      }
    })
  }

  const label = active ? t("removeFavorite") : t("addFavorite")

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={active}
        className={cn(
          "bg-surface-low hover:bg-surface-container inline-flex h-10 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors",
          className,
        )}
      >
        <Heart className={cn("size-4", active && "fill-destructive text-destructive")} aria-hidden />
        {active ? tc("saved") : tc("save")}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "bg-background/90 hover:bg-background flex size-9 cursor-pointer items-center justify-center rounded-full shadow-sm backdrop-blur transition-colors",
        className,
      )}
    >
      <Heart className={cn("size-[18px]", active ? "fill-destructive text-destructive" : "text-foreground")} aria-hidden />
    </button>
  )
}
