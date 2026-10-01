"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { unsubscribeAlert } from "@/lib/actions/alerts"

export function UnsubscribeButton({ token, alreadyOff }: { token: string; alreadyOff: boolean }) {
  const t = useTranslations("alerts")
  const [done, setDone] = useState(alreadyOff)
  const [pending, start] = useTransition()
  if (done) {
    return (
      <p role="status" className="bg-primary-soft mt-6 rounded-lg px-4 py-3 text-sm">
        <strong>{t("unsubscribedTitle")}.</strong> {t("unsubscribedText")}
      </p>
    )
  }
  return (
    <Button className="mt-6" disabled={pending} onClick={() => start(async () => setDone((await unsubscribeAlert(token)).ok))}>
      {t("unsubscribe")}
    </Button>
  )
}
