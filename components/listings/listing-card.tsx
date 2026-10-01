import { Bath, BedDouble, Camera, ImageOff, MapPin, Maximize } from "lucide-react"
import Image from "next/image"
import { useFormatter, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { photoUrl } from "@/lib/env"
import { displayTitle, isNewListing, pricePerSqm } from "@/lib/listings/display"
import type { ListingSummary } from "@/lib/listings/queries"
import { listingPath } from "@/lib/urls"
import { cn } from "@/lib/utils"
import { FavoriteButton } from "./favorite-button"

export function ListingCard({
  listing,
  layout = "vertical",
  priority = false,
}: {
  listing: ListingSummary
  layout?: "vertical" | "horizontal"
  priority?: boolean
}) {
  const t = useTranslations("card")
  const tc = useTranslations("common")
  const tTypes = useTranslations("types")
  const tPhrase = useTranslations("operationPhrase")
  const tf = useTranslations("features")
  const format = useFormatter()

  const title = displayTitle(listing, { types: tTypes, phrase: tPhrase })
  const href = listingPath(listing.id, title)
  const perSqm = pricePerSqm(listing.price, listing.area_m2)
  const place = [listing.neighborhood, listing.city].filter(Boolean).join(", ")
  const cover = listing.photos[0]
  const isNew = isNewListing(listing.published_at)
  const horizontal = layout === "horizontal"

  return (
    <article
      className={cn(
        "group bg-card relative flex overflow-hidden rounded-lg border transition-shadow hover:shadow-[var(--shadow-raised)]",
        horizontal ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <div
        className={cn(
          "bg-surface-low relative shrink-0 overflow-hidden",
          horizontal ? "aspect-[4/3] sm:aspect-auto sm:w-[42%] sm:min-h-56" : "aspect-[4/3]",
        )}
      >
        {cover ? (
          <Image
            src={photoUrl(cover)}
            alt={title}
            fill
            priority={priority}
            sizes={horizontal ? "(min-width: 1024px) 380px, (min-width: 640px) 42vw, 100vw" : "(min-width: 1280px) 330px, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-sm">
            <ImageOff className="size-6" aria-hidden />
            {t("noPhoto")}
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {isNew && (
            <span className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-[11px] font-semibold">
              {t("new")}
            </span>
          )}
        </div>
        <FavoriteButton listingId={listing.id} className="absolute top-2.5 right-2.5 z-10" />
        {listing.photos.length > 1 && (
          <span className="bg-background/90 absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium">
            <Camera className="size-3.5" aria-hidden />
            {listing.photos.length}
          </span>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col gap-2", horizontal ? "p-4 sm:p-5" : "p-4")}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="font-heading text-xl font-bold tracking-tight">
            {format.number(listing.price, "price")}
            {listing.operation === "rent" && (
              <span className="text-muted-foreground text-sm font-medium">{tc("perMonth")}</span>
            )}
          </p>
          {perSqm && listing.operation === "sale" && (
            <span className="text-muted-foreground text-xs">
              {tc("pricePerSqm", { value: format.number(perSqm, "price") })}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold">
          <Link href={href} className="after:absolute after:inset-0 group-hover:text-primary focus-visible:outline-none">
            {title}
          </Link>
        </h3>
        {place && (
          <p className="text-muted-foreground flex items-center gap-1 text-[13px]">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{place}</span>
          </p>
        )}
        <ul className="text-subtle-foreground mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-[13px]">
          {listing.bedrooms != null && (
            <li className="flex items-center gap-1.5">
              <BedDouble className="size-4" aria-hidden />
              {t("beds", { count: listing.bedrooms })}
            </li>
          )}
          {listing.bathrooms != null && (
            <li className="flex items-center gap-1.5">
              <Bath className="size-4" aria-hidden />
              {t("baths", { count: listing.bathrooms })}
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <Maximize className="size-4" aria-hidden />
            {tc("sqm", { value: listing.area_m2 })}
          </li>
          {horizontal &&
            listing.features.slice(0, 2).map((f) => (
              <li key={f} className="bg-surface-low rounded px-2 py-0.5 text-xs">
                {tf(f)}
              </li>
            ))}
        </ul>
      </div>
    </article>
  )
}
