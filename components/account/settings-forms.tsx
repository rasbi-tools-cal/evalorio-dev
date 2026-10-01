"use client"

import { Download, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { LANGUAGE_NAMES } from "@/components/layout/language-switcher"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { useRouter } from "@/i18n/navigation"
import { routing, type Locale } from "@/i18n/routing"
import { deleteAccount, updateProfile } from "@/lib/actions/profile"
import { notifyAuthChanged } from "@/lib/auth-events"

export function ProfileForm({ displayName, phone, locale }: { displayName: string; phone: string; locale: Locale }) {
  const t = useTranslations("account")
  const ta = useTranslations("auth")
  const tc = useTranslations("common")
  const [pending, start] = useTransition()
  const [errorField, setErrorField] = useState<string | null>(null)

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        start(async () => {
          const res = await updateProfile({
            displayName: String(form.get("displayName")),
            phone: String(form.get("phone")),
            locale: String(form.get("locale")) as Locale,
          })
          if (res.ok) {
            setErrorField(null)
            toast.success(t("profileSaved"))
          } else {
            setErrorField("field" in res ? (res.field ?? null) : null)
            toast.error(tc("genericError"))
          }
        })
      }}
    >
      <Field label={ta("displayName")} htmlFor="displayName" error={errorField === "displayName" ? tc("genericError") : undefined}>
        <Input id="displayName" name="displayName" defaultValue={displayName} required minLength={2} maxLength={60} autoComplete="name" />
      </Field>
      <Field label={t("defaultPhone")} htmlFor="phone" optionalLabel={tc("optional")} error={errorField === "phone" ? tc("genericError") : undefined}>
        <Input id="phone" name="phone" type="tel" defaultValue={phone} maxLength={20} autoComplete="tel" />
      </Field>
      <Field label={t("preferredLanguage")} htmlFor="locale">
        <NativeSelect id="locale" name="locale" defaultValue={locale}>
          {routing.locales.map((l) => (
            <option key={l} value={l}>
              {LANGUAGE_NAMES[l]}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {tc("save")}
        </Button>
      </div>
    </form>
  )
}

export function DataExport() {
  const t = useTranslations("account")
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground text-sm">{t("exportDataText")}</p>
      <Button asChild variant="outline">
        <a href="/api/account/export" download>
          <Download aria-hidden /> {t("exportData")}
        </a>
      </Button>
    </div>
  )
}

export function DeleteAccount() {
  const t = useTranslations("account")
  const tc = useTranslations("common")
  const [value, setValue] = useState("")
  const [pending, start] = useTransition()
  const router = useRouter()

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        start(async () => {
          const res = await deleteAccount(value)
          if (res.ok) {
            notifyAuthChanged()
            router.replace("/")
            router.refresh()
          }
          else toast.error(tc("genericError"))
        })
      }}
    >
      <p className="text-muted-foreground text-sm">{t("deleteAccountText")}</p>
      <Field label={t("deleteAccountConfirm")} htmlFor="confirm-delete">
        <Input id="confirm-delete" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" className="max-w-xs" />
      </Field>
      <div>
        <Button type="submit" variant="destructive" disabled={value !== "DELETE" || pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {t("deleteAccount")}
        </Button>
      </div>
    </form>
  )
}
