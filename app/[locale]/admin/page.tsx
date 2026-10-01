import Image from "next/image"
import { getFormatter, getTranslations } from "next-intl/server"
import { ModerationActions } from "@/components/admin/admin-actions"
import { Link } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { photoUrl } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { listingPath } from "@/lib/urls"
import { containsContactInfo } from "@/lib/utils"

export default async function ModerationQueuePage({ params }: PageProps<"/[locale]/admin">) {
  await pageLocale(params)
  const [t, tt, tph, format] = await Promise.all([
    getTranslations("admin"),
    getTranslations("types"),
    getTranslations("operationPhrase"),
    getFormatter(),
  ])
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, owner_id, title, description, operation, property_type, price, area_m2, updated_at, city:cities(name), photos:listing_photos(storage_path, position)",
    )
    .eq("status", "pending")
    .order("updated_at", { ascending: true })
    .limit(50)

  const owners = await Promise.all(
    [...new Set((listings ?? []).map((l) => l.owner_id))].map(async (id) => {
      const [{ data: email }, { data: profile }] = await Promise.all([
        supabase.rpc("admin_user_email", { p_user_id: id }),
        supabase.from("profiles").select("display_name, is_trusted, created_at").eq("id", id).single(),
      ])
      return { id, email, profile }
    }),
  )

  if (!listings?.length) return <p className="bg-surface text-muted-foreground rounded-xl border border-dashed p-10 text-center">{t("emptyQueue")}</p>

  return (
    <ul className="flex flex-col gap-4">
      {listings.map((l) => {
        const owner = owners.find((o) => o.id === l.owner_id)
        const photos = [...(l.photos ?? [])].sort((a, b) => a.position - b.position)
        const flagged = containsContactInfo(`${l.title ?? ""} ${l.description ?? ""}`)
        return (
          <li key={l.id} className="bg-card rounded-xl border p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">
                #{l.id} · {l.title || `${tt(l.property_type)} ${tph(l.operation)}`}
              </h2>
              <p className="text-muted-foreground text-xs">{t("submitted", { date: format.dateTime(new Date(l.updated_at), { dateStyle: "medium", timeStyle: "short" }) })}</p>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {l.city?.name} · {l.price != null && format.number(l.price, "price")} · {l.area_m2} m²
            </p>
            <p className="mt-1 text-sm">
              {t("owner")}: {owner?.profile?.display_name} · {owner?.email}
              {owner?.profile?.is_trusted && <span className="text-primary ml-2 font-semibold">{t("trusted")}</span>}
            </p>
            {flagged && <p className="bg-warning-soft text-warning mt-2 rounded px-2 py-1 text-xs">⚠ contact details / links in text</p>}
            {l.description && <p className="text-subtle-foreground mt-3 line-clamp-4 text-sm whitespace-pre-line">{l.description}</p>}
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {photos.map((p) => (
                <a key={p.storage_path} href={photoUrl(p.storage_path)} target="_blank" rel="noreferrer" className="relative block h-24 w-32 shrink-0 overflow-hidden rounded-md">
                  <Image src={photoUrl(p.storage_path)} alt="" fill sizes="128px" className="object-cover" />
                </a>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <ModerationActions listingId={l.id} />
              <Link href={listingPath(l.id, l.title)} className="text-primary text-sm font-semibold hover:underline">
                {t("openListing")} →
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
