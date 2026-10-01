"use client"

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { addPhoto, removePhoto, reorderPhotos } from "@/lib/actions/listings"
import { PHOTO_BUCKET, photoUrl } from "@/lib/env"
import { preparePhoto } from "@/lib/images"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export interface UploadedPhoto {
  id: string
  storage_path: string
}

const MAX_PHOTOS = 20

export function PhotoUploader({
  listingId,
  ownerId,
  photos,
  onChange,
  onBusyChange,
}: {
  listingId: number
  ownerId: string
  photos: UploadedPhoto[]
  onChange: (photos: UploadedPhoto[]) => void
  onBusyChange?: (busy: boolean) => void
}) {
  const t = useTranslations("post")
  const tc = useTranslations("common")
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  // Latest photos for the sequential upload loop (props change while it runs).
  const photosRef = useRef(photos)
  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  const upload = async (files: File[]) => {
    const room = MAX_PHOTOS - photosRef.current.length
    if (room <= 0) {
      toast.error(t("photoLimit"))
      return
    }
    if (files.length > room) toast.warning(t("photoLimit"))
    const batch = files.slice(0, room)
    const supabase = createClient()
    setProgress({ done: 0, total: batch.length })
    onBusyChange?.(true)

    for (const file of batch) {
      try {
        const prepared = await preparePhoto(file)
        const path = `${ownerId}/${listingId}/${crypto.randomUUID()}.${prepared.ext}`
        const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, prepared.blob, {
          contentType: prepared.ext === "webp" ? "image/webp" : "image/jpeg",
          cacheControl: "31536000",
          upsert: false,
        })
        if (error) throw error
        const res = await addPhoto(listingId, { path, width: prepared.width, height: prepared.height })
        if (!res.ok) {
          toast.error(res.error === "photoLimit" ? t("photoLimit") : tc("genericError"))
          break
        }
        const next = [...photosRef.current, { id: res.data.id, storage_path: path }]
        photosRef.current = next
        onChange(next)
      } catch {
        toast.error(t("photoTooBig", { name: file.name }))
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p))
    }
    setProgress(null)
    onBusyChange?.(false)
  }

  const remove = async (photo: UploadedPhoto) => {
    const previous = photos
    onChange(photos.filter((p) => p.id !== photo.id))
    const res = await removePhoto(photo.id)
    if (!res.ok) {
      onChange(previous)
      toast.error(tc("genericError"))
    }
  }

  const move = async (index: number, to: number) => {
    if (to < 0 || to >= photos.length) return
    const next = [...photos]
    const [item] = next.splice(index, 1)
    next.splice(to, 0, item)
    const previous = photos
    onChange(next)
    const res = await reorderPhotos(listingId, next.map((p) => p.id))
    if (!res.ok) {
      onChange(previous)
      toast.error(tc("genericError"))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          upload(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")))
        }}
        className={cn(
          "bg-surface flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging && "border-primary bg-primary-soft",
        )}
      >
        <div className="bg-primary-soft text-primary flex size-12 items-center justify-center rounded-lg">
          <ImagePlus className="size-6" aria-hidden />
        </div>
        <p className="font-medium">{t("dropPhotos")}</p>
        <p className="text-muted-foreground max-w-md text-sm">{t("photosHelp")}</p>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={!!progress || photos.length >= MAX_PHOTOS}
          className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
        >
          {progress ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {progress ? t("uploading", progress) : t("addPhotos")}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            upload(Array.from(e.target.files ?? []))
            e.target.value = ""
          }}
        />
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {photos.length}/{MAX_PHOTOS}
        </p>
      </div>

      {photos.length > 0 && (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <li key={photo.id} className="bg-surface-low group relative aspect-[4/3] overflow-hidden rounded-lg border">
              <Image src={photoUrl(photo.storage_path)} alt="" fill sizes="(min-width: 1024px) 220px, 45vw" className="object-cover" />
              {i === 0 && (
                <span className="bg-primary text-primary-foreground absolute top-2 left-2 flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold">
                  <Star className="size-3" aria-hidden /> {t("cover")}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2">
                <div className="flex gap-1">
                  <PhotoAction label={t("moveLeft")} onClick={() => move(i, i - 1)} disabled={i === 0}>
                    <ArrowLeft />
                  </PhotoAction>
                  <PhotoAction label={t("moveRight")} onClick={() => move(i, i + 1)} disabled={i === photos.length - 1}>
                    <ArrowRight />
                  </PhotoAction>
                  {i > 0 && (
                    <PhotoAction label={t("makeCover")} onClick={() => move(i, 0)}>
                      <Star />
                    </PhotoAction>
                  )}
                </div>
                <PhotoAction label={t("removePhoto")} onClick={() => remove(photo)}>
                  <Trash2 />
                </PhotoAction>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function PhotoAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="bg-background/90 hover:bg-background flex size-8 cursor-pointer items-center justify-center rounded-md disabled:opacity-40 [&_svg]:size-4"
    >
      {children}
    </button>
  )
}
