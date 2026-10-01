import { Mail, Phone } from "lucide-react"
import type { Metadata } from "next"
import { after } from "next/server"
import { getFormatter, getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { pageLocale } from "@/i18n/locale"
import { createClient, getUser } from "@/lib/supabase/server"
import { listingPath } from "@/lib/urls"
import { cn } from "@/lib/utils"

export async function generateMetadata({ params }: PageProps<"/[locale]/account/messages">): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: "account" })
  return { title: t("messagesTitle") }
}

export default async function MessagesPage({ params, searchParams }: PageProps<"/[locale]/account/messages">) {
  await pageLocale(params)
  const { tab } = await searchParams
  const sent = tab === "sent"
  const user = await getUser()
  const [t, format] = await Promise.all([getTranslations("account"), getFormatter()])
  const supabase = await createClient()

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, sender_name, sender_email, sender_phone, created_at, read_at, recipient_id, listing:listings(id, title)")
    .eq(sent ? "sender_id" : "recipient_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(200)

  const unreadIds = sent ? [] : (messages ?? []).filter((m) => !m.read_at).map((m) => m.id)
  if (unreadIds.length) {
    after(async () => {
      await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds)
    })
  }

  const tabClass = (active: boolean) =>
    cn("border-b-2 px-3 py-2 text-sm font-semibold", active ? "border-primary text-primary" : "text-muted-foreground border-transparent hover:text-foreground")

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{t("messagesTitle")}</h1>
      <nav className="mb-6 flex gap-2 border-b" aria-label={t("messagesTitle")}>
        <Link href="/account/messages" className={tabClass(!sent)} aria-current={!sent ? "page" : undefined}>
          {t("receivedMessages")}
        </Link>
        <Link href="/account/messages?tab=sent" className={tabClass(sent)} aria-current={sent ? "page" : undefined}>
          {t("sentMessages")}
        </Link>
      </nav>
      {!messages?.length ? (
        <p className="bg-surface text-muted-foreground rounded-xl border border-dashed p-10 text-center">{t("noMessages")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <li key={m.id} className={cn("bg-card rounded-xl border p-4 sm:p-5", !sent && !m.read_at && "border-primary")}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {sent ? t("about", { listing: m.listing?.title || `#${m.listing?.id}` }) : m.sender_name}
                  {!sent && !m.read_at && <span className="bg-primary ml-2 inline-block size-2 rounded-full align-middle" aria-hidden />}
                </p>
                <time className="text-muted-foreground text-xs" dateTime={m.created_at}>
                  {format.dateTime(new Date(m.created_at), { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </div>
              {!sent && m.listing && (
                <p className="text-muted-foreground mt-0.5 text-sm">
                  <Link href={listingPath(m.listing.id, m.listing.title)} className="hover:text-primary">
                    {t("about", { listing: m.listing.title || `#${m.listing.id}` })}
                  </Link>
                </p>
              )}
              <p className="mt-3 text-sm whitespace-pre-line">{m.body}</p>
              {!sent && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${m.sender_email}?subject=${encodeURIComponent(`Re: ${m.listing?.title ?? "Evalorio"}`)}`}
                    className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold"
                  >
                    <Mail className="size-4" aria-hidden /> {t("replyByEmail")}
                  </a>
                  {m.sender_phone && (
                    <a href={`tel:${m.sender_phone.replace(/[^\d+]/g, "")}`} className="bg-surface-low hover:bg-surface-container inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold">
                      <Phone className="size-4" aria-hidden /> {m.sender_phone}
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
