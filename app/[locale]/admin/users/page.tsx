import { getFormatter, getTranslations } from "next-intl/server"
import { BanButton } from "@/components/admin/admin-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { pageLocale } from "@/i18n/locale"
import { createClient, getUser } from "@/lib/supabase/server"

export default async function UsersPage({ params, searchParams }: PageProps<"/[locale]/admin/users">) {
  await pageLocale(params)
  const { q } = await searchParams
  const query = typeof q === "string" ? q.slice(0, 100) : ""
  const [t, format, me] = await Promise.all([getTranslations("admin"), getFormatter(), getUser()])
  const supabase = await createClient()
  const { data: users } = await supabase.rpc("admin_users", { p_query: query || undefined, p_limit: 100 })

  return (
    <div className="flex flex-col gap-4">
      <form method="get" className="flex max-w-md gap-2">
        <label htmlFor="q" className="sr-only">
          {t("searchUsers")}
        </label>
        <Input id="q" name="q" defaultValue={query} placeholder={t("searchUsers")} />
        <Button type="submit" variant="outline">
          {t("searchUsers")}
        </Button>
      </form>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">{t("owner")}</th>
              <th className="p-3 font-semibold">#</th>
              <th className="p-3 font-semibold" />
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  {u.display_name}
                  <span className="text-muted-foreground block text-xs">{format.dateTime(new Date(u.created_at), { dateStyle: "medium" })}</span>
                </td>
                <td className="p-3">{u.listings}</td>
                <td className="p-3 text-xs">
                  {u.role === "admin" && <span className="mr-2 font-semibold">admin</span>}
                  {u.is_trusted && <span className="text-primary mr-2">{t("trusted")}</span>}
                  {u.is_banned && <span className="text-destructive">{t("banned")}</span>}
                </td>
                <td className="p-3 text-right">{u.id !== me?.id && u.role !== "admin" && <BanButton userId={u.id} banned={u.is_banned} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
