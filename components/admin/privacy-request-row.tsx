"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { updatePrivacyRequest } from "@/lib/actions/privacy"

const STATUSES = ["received", "verifying", "in_progress", "completed", "rejected"] as const
type Status = (typeof STATUSES)[number]

export function PrivacyRequestControls({ id, status, note }: { id: string; status: Status; note: string }) {
  const t = useTranslations("privacyAdmin")
  const tc = useTranslations("common")
  const [value, setValue] = useState<Status>(status)
  const [text, setText] = useState(note)
  const [pending, start] = useTransition()

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await updatePrivacyRequest({ id, status: value, note: text })
          if (res.ok) toast.success(tc("saved"))
          else toast.error(tc("genericError"))
        })
      }}
    >
      <NativeSelect aria-label="Status" value={value} onChange={(e) => setValue(e.target.value as Status)} className="sm:w-48">
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`statuses.${s}`)}
          </option>
        ))}
      </NativeSelect>
      <Textarea aria-label={t("note")} placeholder={t("note")} value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={3000} className="min-h-10 flex-1" />
      <Button type="submit" variant="outline" disabled={pending}>
        {t("update")}
      </Button>
    </form>
  )
}
