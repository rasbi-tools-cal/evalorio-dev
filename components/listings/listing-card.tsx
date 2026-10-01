import { Bath, BedDouble, MapPin, Maximize, TrendingDown } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { displayTitle, isNewListing, pricePerSqm } from "@/lib/listings/display"
import type { ListingSummary } from "@/lib/listings/queries"
import { listingPath } from "@/lib/urls"
import { cn } from "@/lib/utils"
import { CardActions } from "./card-actions"
import { CardPhotos } from "./card-photos"
import { FavoriteButton } from "./favorite-button"
import { HighlightableCard } from "./highlightable-card"

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
  const tl = useTranslations("listing")
  const tTypes = useTranslations("types")
  const tPhrase = useTranslations("operationPhrase")
  const tf = useTranslations("features")
  const format = useFormatter()

  const title = displayTitle(listing, { types: tTypes, phrase: tPhrase })
  const href = listingPath(listing.id, title)
  const perSqm = pricePerSqm(listing.price, listing.area_m2)
  const place = [listing.neighborhood, listing.city].filter(Boolean).join(", ")
  const isNew = isNewListing(listing.published_at)
  const horizontal = layout === "horizontal"
  const drop = listing.previous_price && listing.previous_price > listing.price ? listing.previous_price - listing.price : null

  // "Floor 3 · Exterior · Elevator · Parking" — only what the owner filled in.
  const details = [
    listing.floor != null ? (listing.floor === 0 ? tl("groundFloor") : t("floor", { floor: listing.floor })) : null,
    listing.exterior == null ? null : listing.exterior ? t("exterior") : t("interior"),
    listing.features.includes("elevator") ? tf("elevator") : null,
    listing.features.includes("parking") ? tf("parking") : null,
  ].filter(Boolean) as string[]

  return (
    <HighlightableCard
      listingId={listing.id}
      className={cn(
        "group bg-card relative flex overflow-hidden rounded-lg border transition-shadow hover:shadow-[var(--shadow-raised)]",
        "data-[active=true]:border-primary data-[active=true]:ring-primary/30 data-[active=true]:ring-2",
        horizontal ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <div className={cn("relative shrink-0", horizontal && "sm:w-[42%]")}>
        <CardPhotos
          photos={listing.photos}
          total={listing.photo_count}
          title={title}
          href={href}
          priority={priority}
          thumbnails={horizontal}
          sizes={horizontal ? "(min-width: 1024px) 400px, (min-width: 640px) 42vw, 100vw" : "(min-width: 1280px) 330px, (min-width: 640px) 50vw, 100vw"}
        />
        <div className="pointer-events-none absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1.5">
          {isNew && <span className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-[11px] font-semibold">{t("new")}</span>}
          {drop && (
            <span className="bg-destructive text-destructive-foreground flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold">
              <TrendingDown className="size-3" aria-hidden />
              {t("priceDrop", { amount: format.number(drop, "price") })}
            </span>
          )}
        </div>
        {!horizontal && <FavoriteButton listingId={listing.id} className="absolute top-2.5 right-2.5 z-20" />}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col gap-2", horizontal ? "p-4 sm:p-5" : "p-4")}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="font-heading text-xl font-bold tracking-tight">
            {format.number(listing.price, "price")}
            {listing.operation === "rent" && <span className="text-muted-foreground text-sm font-medium">{tc("perMonth")}</span>}
          </p>
          {drop && listing.previous_price && (
            <span className="text-muted-foreground text-xs line-through" aria-label={t("previousPrice")}>
              {format.number(listing.previous_price, "price")}
            </span>
          )}
          {perSqm && listing.operation === "sale" && (
            <span className="text-muted-foreground text-xs">{tc("pricePerSqm", { value: format.number(perSqm, "price") })}</span>
          )}
          {horizontal && (
            <span className="bg-surface-low text-subtle-foreground ml-auto rounded px-2 py-0.5 text-[11px] font-semibold">
              {listing.seller_type === "agency" ? t("agency") : t("privateOwner")}
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
        <ul className="text-subtle-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
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
        </ul>
        {horizontal && details.length > 0 && <p className="text-subtle-foreground text-[13px]">{details.join(" · ")}</p>}
        {horizontal && listing.excerpt && (
          <p className="text-muted-foreground line-clamp-2 text-[13px] leading-relaxed sm:line-clamp-3">{listing.excerpt}</p>
        )}
        {horizontal ? (
          <div className="mt-auto border-t pt-3">
            <CardActions listingId={listing.id} title={title} hasPhone={Boolean(listing.has_phone)} />
          </div>
        ) : (
          <div className="mt-auto" />
        )}
      </div>
    </HighlightableCard>
  )
}
