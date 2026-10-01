import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ListingCard } from "@/components/listings/listing-card"
import { pageLocale } from "@/i18n/locale"
import type { CountryCode, Operation, PropertyType } from "@/lib/catalog"
import type { ListingSummary } from "@/lib/listings/queries"
import { createClient } from "@/lib/supabase/server"

export async function generateMetadata({ params }: PageProps<"/[locale]/account/favorites">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "favorites" })
  return { title: t("title") }
}

export default async function FavoritesPage({ params }: PageProps<"/[locale]/account/favorites">) {
  await pageLocale(params)
  const t = await getTranslations("favorites")
  const supabase = await createClient()
  const { data } = await supabase
    .from("favorites")
    .select(
      `created_at, listing:listings(id, title, operation, property_type, price, area_m2, bedrooms, bathrooms, features, published_at, country_code, status,
       city:cities(name, slug), neighborhood:neighborhoods(name), photos:listing_photos(storage_path, position))`,
    )
    .order("created_at", { ascending: false })

  const items: ListingSummary[] = (data ?? [])
    .map((f) => f.listing)
    .filter((l): l is NonNullable<typeof l> => Boolean(l && l.status === "active" && l.city && l.price && l.area_m2))
    .map((l) => ({
      id: l.id,
      title: l.title,
      operation: l.operation as Operation,
      property_type: l.property_type as PropertyType,
      price: l.price!,
      area_m2: l.area_m2!,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      features: l.features,
      published_at: l.published_at ?? "",
      city: l.city!.name,
      city_slug: l.city!.slug,
      country_code: l.country_code as CountryCode,
      neighborhood: l.neighborhood?.name ?? null,
      lat: 0,
      lng: 0,
      photos: [...(l.photos ?? [])].sort((a, b) => a.position - b.position).map((p) => p.storage_path),
    }))

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      {items.length === 0 ? (
        <p className="bg-surface text-muted-foreground rounded-xl border border-dashed p-10 text-center">{t("empty")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  )
}
