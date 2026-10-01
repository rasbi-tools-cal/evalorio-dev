import { Plus } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { MyListingRow, type MyListing } from "@/components/account/my-listing-row"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { createClient, getUser } from "@/lib/supabase/server"

export async function generateMetadata({ params }: PageProps<"/[locale]/account/listings">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "account" })
  return { title: t("listingsTitle") }
}

export default async function MyListingsPage({ params }: PageProps<"/[locale]/account/listings">) {
  await pageLocale(params)
  const user = await getUser()
  const t = await getTranslations("account")
  const supabase = await createClient()
  const [{ data: listings }, { data: stats }] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, status, title, operation, property_type, price, area_m2, bedrooms, views_count, expires_at, rejection_reason, updated_at, city:cities(name), photos:listing_photos(storage_path, position)",
      )
      .eq("owner_id", user!.id)
      .order("updated_at", { ascending: false }),
    supabase.rpc("my_listing_stats"),
  ])

  const rows: MyListing[] = (listings ?? []).map((l) => {
    const s = stats?.find((x) => x.listing_id === l.id)
    const cover = [...(l.photos ?? [])].sort((a, b) => a.position - b.position)[0]?.storage_path ?? null
    return {
      id: l.id,
      status: l.status,
      title: l.title,
      operation: l.operation,
      property_type: l.property_type,
      price: l.price,
      city: l.city?.name ?? null,
      cover,
      views: l.views_count,
      reveals: Number(s?.reveals ?? 0),
      messages: Number(s?.messages ?? 0),
      expiresAt: l.expires_at,
      rejectionReason: l.rejection_reason,
    }
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("listingsTitle")}</h1>
        <Button asChild>
          <Link href="/post">
            <Plus aria-hidden /> {t("newListing")}
          </Link>
        </Button>
      </div>
      {rows.length === 0 ? (
        <div className="bg-surface rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground">{t("noListings")}</p>
          <Button asChild className="mt-4">
            <Link href="/post">{t("newListing")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <MyListingRow listing={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
