"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AUTH_CHANGED_EVENT } from "@/lib/auth-events"
import { createClient } from "@/lib/supabase/client"

interface FavoritesState {
  ready: boolean
  loggedIn: boolean
  ids: Set<number>
  set: (id: number, favorite: boolean) => void
}

const FavoritesContext = createContext<FavoritesState | null>(null)

/** Loads the signed-in user's favourite ids once, client-side, so listing pages stay cacheable. */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<number>>(new Set())
  const [loggedIn, setLoggedIn] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        setLoggedIn(false)
        setIds(new Set())
        setReady(true)
        return
      }
      const { data } = await supabase.from("favorites").select("listing_id")
      setLoggedIn(true)
      setIds(new Set((data ?? []).map((f) => f.listing_id)))
      setReady(true)
    }
    load()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") load()
    })
    window.addEventListener(AUTH_CHANGED_EVENT, load)
    return () => {
      sub.subscription.unsubscribe()
      window.removeEventListener(AUTH_CHANGED_EVENT, load)
    }
  }, [])

  const set = useCallback((id: number, favorite: boolean) => {
    setIds((prev) => {
      const next = new Set(prev)
      if (favorite) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const value = useMemo(() => ({ ready, loggedIn, ids, set }), [ready, loggedIn, ids, set])
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider")
  return ctx
}
