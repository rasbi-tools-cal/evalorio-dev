"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { photoUrl } from "@/lib/env"
import { cn } from "@/lib/utils"

const subscribeNever = () => () => {}

/** 0-based index from "?photo=N" (1-based), or null. */
function photoFromUrl(count: number) {
  const n = Number(new URLSearchParams(window.location.search).get("photo"))
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : null
}

/**
 * A "?photo=N" link (1-based, from the photo carousels on result cards) opens the lightbox on that
 * photo. It is read in the browser so the listing page can stay static.
 */
export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const t = useTranslations("listing")
  const tc = useTranslations("common")
  // null on the server and until the visitor opens/closes the lightbox: then the URL decides.
  const urlPhoto = useSyncExternalStore(subscribeNever, () => photoFromUrl(photos.length), () => null)
  const [lightbox, setLightbox] = useState<{ open: boolean; start: number } | null>(null)
  const open = lightbox ? lightbox.open : urlPhoto !== null
  const start = lightbox ? lightbox.start : (urlPhoto ?? 0)
  const setOpen = (value: boolean) => setLightbox({ open: value, start })

  const openAt = (i: number) => setLightbox({ open: true, start: i })

  if (photos.length === 0) {
    return <div className="bg-surface-low aspect-[16/9] w-full rounded-xl" aria-hidden />
  }

  const alt = (i: number) => `${title} – ${t("photoOf", { index: i + 1, total: photos.length })}`

  return (
    <section aria-label={t("gallery")} className="relative">
      {/* Mobile: swipeable strip */}
      <MobileStrip photos={photos} alt={alt} onOpen={openAt} />

      {/* Desktop: mosaic like the mockup */}
      <div className="hidden h-[520px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl md:grid">
        {photos.slice(0, 5).map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => openAt(i)}
            className={cn(
              "group bg-surface-low relative cursor-pointer overflow-hidden",
              i === 0 && "col-span-2 row-span-2",
              photos.length === 1 && "col-span-4",
              photos.length === 2 && i === 1 && "col-span-2 row-span-2",
            )}
          >
            <Image
              src={photoUrl(p)}
              alt={alt(i)}
              fill
              priority={i === 0}
              sizes={i === 0 ? "(min-width: 1440px) 700px, 50vw" : "(min-width: 1440px) 350px, 25vw"}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => openAt(0)}
          className="bg-background/95 hover:bg-background absolute right-4 bottom-4 hidden cursor-pointer items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold shadow md:flex"
        >
          <Images className="size-4" aria-hidden />
          {t("showAllPhotos", { count: photos.length })}
        </button>
      )}

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95" />
          <DialogPrimitive.Content aria-describedby={undefined} className="fixed inset-0 z-50 flex flex-col outline-none">
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="absolute top-3 right-3 z-10 cursor-pointer rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
              aria-label={tc("close")}
            >
              <X className="size-6" />
            </DialogPrimitive.Close>
            {open && <Lightbox photos={photos} start={start} alt={alt} />}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </section>
  )
}

function MobileStrip({ photos, alt, onOpen }: { photos: string[]; alt: (i: number) => string; onOpen: (i: number) => void }) {
  const [ref, api] = useEmblaCarousel({ loop: false })
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!api) return
    const onSelect = () => setIndex(api.selectedScrollSnap())
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  return (
    <div className="relative -mx-4 md:hidden">
      <div ref={ref} className="overflow-hidden">
        <div className="flex">
          {photos.map((p, i) => (
            <button key={p} type="button" onClick={() => onOpen(i)} className="relative aspect-[4/3] min-w-0 flex-[0_0_100%]">
              <Image src={photoUrl(p)} alt={alt(i)} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
      </div>
      <span className="absolute right-3 bottom-3 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white" aria-live="polite">
        {index + 1}/{photos.length}
      </span>
    </div>
  )
}

function Lightbox({ photos, start, alt }: { photos: string[]; start: number; alt: (i: number) => string }) {
  const t = useTranslations("listing")
  const [ref, api] = useEmblaCarousel({ loop: photos.length > 1, startIndex: start })
  const [index, setIndex] = useState(start)
  const prev = useCallback(() => api?.scrollPrev(), [api])
  const next = useCallback(() => api?.scrollNext(), [api])

  useEffect(() => {
    if (!api) return
    const onSelect = () => setIndex(api.selectedScrollSnap())
    api.on("select", onSelect)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") api.scrollPrev()
      if (e.key === "ArrowRight") api.scrollNext()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      api.off("select", onSelect)
      window.removeEventListener("keydown", onKey)
    }
  }, [api])

  return (
    <div className="flex h-full flex-col">
      <div ref={ref} className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {photos.map((p, i) => (
            <div key={p} className="relative h-full min-w-0 flex-[0_0_100%]">
              <Image src={photoUrl(p)} alt={alt(i)} fill sizes="100vw" className="object-contain" priority={i === start} />
            </div>
          ))}
        </div>
      </div>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label={t("previousPhoto")}
            className="absolute top-1/2 left-3 hidden -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:block"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={t("nextPhoto")}
            className="absolute top-1/2 right-3 hidden -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:block"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
      <p className="py-3 text-center text-sm text-white/80" aria-live="polite">
        {t("photoOf", { index: index + 1, total: photos.length })}
      </p>
    </div>
  )
}
