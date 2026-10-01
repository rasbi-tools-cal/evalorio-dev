import { getFormatter } from "next-intl/server"
import { pageLocale } from "@/i18n/locale"
import { createClient } from "@/lib/supabase/server"

export default async function LogPage({ params }: PageProps<"/[locale]/admin/log">) {
  await pageLocale(params)
  const format = await getFormatter()
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from("moderation_log")
    .select("id, action, note, listing_id, target_user_id, created_at, actor:profiles!moderation_log_actor_id_fkey(display_name)")
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <ol className="divide-y rounded-xl border">
      {(entries ?? []).map((e) => (
        <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3 text-sm">
          <time className="text-muted-foreground text-xs">{format.dateTime(new Date(e.created_at), { dateStyle: "short", timeStyle: "short" })}</time>
          <span className="font-semibold">{e.action}</span>
          {e.listing_id && <span>#{e.listing_id}</span>}
          <span className="text-muted-foreground">{e.actor?.display_name}</span>
          {e.note && <span className="text-subtle-foreground w-full">{e.note}</span>}
        </li>
      ))}
    </ol>
  )
}
