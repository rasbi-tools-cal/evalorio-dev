"use client"

import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "@/i18n/navigation"
import { moderateListing, resolveReport, setUserBanned } from "@/lib/actions/admin"

function useRun() {
  const tc = useTranslations("common")
  const ta = useTranslations("admin")
  const router = useRouter()
  const [pending, start] = useTransition()
  const run = (fn: () => Promise<{ ok: boolean }>) =>
    start(async () => {
      const res = await fn()
      if (res.ok) {
        toast.success(ta("done"))
        router.refresh()
      } else toast.error(tc("genericError"))
    })
  return { pending, run }
}

export function ModerationActions({ listingId, allowApprove = true }: { listingId: number; allowApprove?: boolean }) {
  const t = useTranslations("admin")
  const { pending, run } = useRun()
  const [note, setNote] = useState("")
  const [mode, setMode] = useState<null | "reject" | "remove">(null)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {allowApprove && (
          <Button size="sm" disabled={pending} onClick={() => run(() => moderateListing({ listingId, action: "approve" }))}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {t("approve")}
          </Button>
        )}
        {allowApprove && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setMode(mode === "reject" ? null : "reject")}>
            {t("reject")}
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-destructive" disabled={pending} onClick={() => setMode(mode === "remove" ? null : "remove")}>
          {t("remove")}
        </Button>
      </div>
      {mode && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`note-${listingId}`} className="text-sm font-medium">
            {t("rejectReason")}
          </label>
          <Textarea id={`note-${listingId}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} className="min-h-16" />
          <div>
            <Button
              size="sm"
              variant={mode === "remove" ? "destructive" : "default"}
              disabled={pending || note.trim().length < 3}
              onClick={() => run(() => moderateListing({ listingId, action: mode, note }))}
            >
              {mode === "remove" ? t("remove") : t("reject")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ReportActions({ reportId }: { reportId: string }) {
  const t = useTranslations("admin")
  const { pending, run } = useRun()
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => resolveReport({ reportId, status: "resolved" }))}>
        {t("resolve")}
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => resolveReport({ reportId, status: "dismissed" }))}>
        {t("dismiss")}
      </Button>
    </div>
  )
}

export function BanButton({ userId, banned }: { userId: string; banned: boolean }) {
  const t = useTranslations("admin")
  const { pending, run } = useRun()
  return (
    <Button
      size="sm"
      variant={banned ? "outline" : "destructive"}
      disabled={pending}
      onClick={() => run(() => setUserBanned({ userId, banned: !banned }))}
    >
      {banned ? t("unban") : t("ban")}
    </Button>
  )
}
