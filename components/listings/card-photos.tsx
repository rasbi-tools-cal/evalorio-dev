"use client"

import useEmblaCarousel from "embla-carousel-react"
import { Camera, ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Link } from "@/i18n/navigation"
import { photoUrl } from "@/lib/env"
import { cn } from "@/lib/utils"

/**
 * Photo carousel for result cards: arrows on hover, swipe on touch, "1/12" counter and an optional
 * strip of the next three photos. Only the current slide and its neighbours mount an <Image>, so a
 * results page with 24 cards still loads ~2 images per card.
 */
export function CardPhotos({
  photos,
  total,
  title,
  href,
  sizes,
  priority = false,
  thumbnails = false,
  className,
}: {
  photos: string[]
  total?: number
  title: string
  href: string
  sizes: string
  priority?: boolean
  thumbnails?: boolean
  className?: string
}) {
  const t = useTranslations("card")
  const tl = useTranslations("listing")
  const [ref, api] = useEmblaCarousel({ loop: photos.length > 1, duration: 22 })
  const [index, setIndex] = useState(0)
  const count = total ?? photos.length

  useEffect(() => {
    if (!api) return
    const onSelect = () => setIndex(api.selectedScrollSnap())
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  if (photos.length === 0) {
    return (
      <div className={cn("bg-surface-low text-muted-foreground flex aspect-[4/3] flex-col items-center justify-center gap-2 text-sm", className)}>
        <ImageOff className="size-6" aria-hidden />
        {t("noPhoto")}
      </div>
    )
  }

  // Neighbours are mounted too so the next swipe never shows an empty frame.
  const near = (i: number) => {
    const n = photos.length
    return i === index || i === (index + 1) % n || i === (index - 1 + n) % n
  }
  const nav = (e: React.MouseEvent, dir: -1 | 1) => {
    e.preventDefault()
    e.stopPropagation()
    if (dir < 0) api?.scrollPrev()
    else api?.scrollNext()
  }
  const thumbs = thumbnails ? photos.slice(1, 4) : []

  return (
    <div className={cn("relative z-10 flex flex-col gap-1", className)}>
      <div className="group/photos bg-surface-low relative aspect-[4/3] overflow-hidden">
        <div ref={ref} className="h-full overflow-hidden" aria-roledescription="carousel" aria-label={tl("gallery")}>
          <div className="flex h-full touch-pan-y">
            {photos.map((p, i) => (
              <Link
                key={p}
                href={i === 0 ? href : `${href}?photo=${i + 1}`}
                className="relative h-full min-w-0 flex-[0_0_100%]"
                aria-label={`${title} – ${tl("photoOf", { index: i + 1, total: count })}`}
                tabIndex={i === index ? 0 : -1}
                draggable={false}
              >
                {near(i) && (
                  <Image
                    src={photoUrl(p)}
                    alt={i === 0 ? title : ""}
                    fill
                    sizes={sizes}
                    priority={priority && i === 0}
                    draggable={false}
                    className="object-cover"
                  />
                )}
              </Link>
            ))}
          </div>
        </div>
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => nav(e, -1)}
              aria-label={tl("previousPhoto")}
              className="bg-background/90 hover:bg-background absolute top-1/2 left-2 hidden size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full opacity-0 shadow transition-opacity group-hover/photos:opacity-100 focus-visible:opacity-100 md:flex"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={(e) => nav(e, 1)}
              aria-label={tl("nextPhoto")}
              className="bg-background/90 hover:bg-background absolute top-1/2 right-2 hidden size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full opacity-0 shadow transition-opacity group-hover/photos:opacity-100 focus-visible:opacity-100 md:flex"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </>
        )}
        <span
          className="pointer-events-none absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white"
          aria-live="polite"
        >
          <Camera className="size-3.5" aria-hidden />
          {index + 1}/{count}
        </span>
      </div>
      {thumbs.length > 0 && (
        <div className="hidden grid-cols-3 gap-1 sm:grid">
          {thumbs.map((p, i) => (
            <Link
              key={p}
              href={`${href}?photo=${i + 2}`}
              className="bg-surface-low relative aspect-[4/3] overflow-hidden"
              aria-label={`${title} – ${tl("photoOf", { index: i + 2, total: count })}`}
            >
              <Image src={photoUrl(p)} alt="" fill sizes="140px" loading="lazy" className="object-cover transition-opacity hover:opacity-90" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
