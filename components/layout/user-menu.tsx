"use client"

import type { User } from "@supabase/supabase-js"
import { Bell, Heart, Home, LogOut, Mail, Settings, Shield } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link, useRouter } from "@/i18n/navigation"
import { AUTH_CHANGED_EVENT } from "@/lib/auth-events"
import { createClient } from "@/lib/supabase/client"
import { initials } from "@/lib/utils"

/** Client-side session for chrome (header/menu) so pages themselves stay cacheable. */
export function useSessionUser() {
  const [state, setState] = useState<{ user: User | null; isAdmin: boolean; ready: boolean }>({
    user: null,
    isAdmin: false,
    ready: false,
  })
  useEffect(() => {
    const supabase = createClient()
    let active = true
    const load = async (user: User | null) => {
      let isAdmin = false
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
        isAdmin = data?.role === "admin"
      }
      if (active) setState({ user, isAdmin, ready: true })
    }
    const refresh = () => supabase.auth.getUser().then(({ data }) => load(data.user))
    refresh()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") load(session?.user ?? null)
    })
    window.addEventListener(AUTH_CHANGED_EVENT, refresh)
    return () => {
      active = false
      sub.subscription.unsubscribe()
      window.removeEventListener(AUTH_CHANGED_EVENT, refresh)
    }
  }, [])
  return state
}

export function UserMenu() {
  const t = useTranslations("nav")
  const router = useRouter()
  const { user, isAdmin, ready } = useSessionUser()

  if (!ready) return <div className="bg-surface-low hidden size-10 animate-pulse rounded-full md:block" aria-hidden />

  if (!user) {
    return (
      <Button asChild variant="ghost" className="hidden md:inline-flex">
        <Link href="/login">{t("login")}</Link>
      </Button>
    )
  }

  const name = (user.user_metadata?.display_name || user.user_metadata?.full_name || user.email) as string
  const signOut = async () => {
    await createClient().auth.signOut()
    router.replace("/")
    router.refresh()
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className="bg-primary text-primary-foreground flex size-10 cursor-pointer items-center justify-center rounded-full text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label={t("account")}
      >
        {initials(name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-muted-foreground truncate text-xs font-normal">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account/listings">
            <Home /> {t("myListings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/favorites">
            <Heart /> {t("favorites")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/searches">
            <Bell /> {t("savedSearches")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/messages">
            <Mail /> {t("messages")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/settings">
            <Settings /> {t("settings")}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield /> {t("admin")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
