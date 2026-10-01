"use client"

import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors")
  const tc = useTranslations("common")
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="page-container flex flex-col items-center py-24 text-center">
      <h1 className="text-2xl font-bold">{t("errorTitle")}</h1>
      <p className="text-muted-foreground mt-2 max-w-md">{t("errorText")}</p>
      {error.digest && <p className="text-muted-foreground mt-2 font-mono text-xs">{error.digest}</p>}
      <Button className="mt-8" onClick={reset}>
        {tc("retry")}
      </Button>
    </div>
  )
}
