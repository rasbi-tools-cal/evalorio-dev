"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { recordConsent } from "@/lib/actions/consent"
import {
  activeOptionalCategories,
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_DAYS,
  type ConsentState,
  type OptionalCategory,
} from "@/lib/consent/registry"
import { POLICY_VERSION } from "@/lib/legal/company"

type Choice = Record<OptionalCategory, boolean>
type Action = "accept_all" | "reject_all" | "custom" | "gpc"

// --- the consent cookie as an external store ---------------------------------------------------

const listeners = new Set<() => void>()
let cachedRaw: string | null = null
let cachedState: ConsentState | null = null

function rawCookie() {
  const entry = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
  return entry ? entry.slice(CONSENT_COOKIE.length + 1) : ""
}

function parse(raw: string): ConsentState | null {
  if (!raw) return null
  try {
    const state = JSON.parse(decodeURIComponent(raw)) as ConsentState
    const ageDays = (Date.now() - new Date(state.at).getTime()) / 86_400_000
    // A new policy version or an old choice means we ask again.
    if (state.version !== POLICY_VERSION || !(ageDays < CONSENT_MAX_AGE_DAYS)) return null
    return state
  } catch {
    return null
  }
}

function getSnapshot() {
  const raw = rawCookie()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedState = parse(raw)
  }
  return cachedState
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function writeCookie(state: ConsentState) {
  const secure = location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(state))}; Path=/; Max-Age=${CONSENT_MAX_AGE_DAYS * 86_400}; SameSite=Lax${secure}`
  listeners.forEach((l) => l())
}

// --- provider -----------------------------------------------------------------------------------

interface ConsentContextValue {
  /** null = no valid choice yet; undefined = not known yet (server render / hydration). */
  consent: ConsentState | null | undefined
  /** Optional categories that are actually in use on this site. */
  categories: OptionalCategory[]
  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  allows: (category: OptionalCategory) => boolean
  save: (choice: Choice, action: Exclude<Action, "gpc">) => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)
const NONE: Choice = { preferences: false, analytics: false, marketing: false }

/**
 * Cookie consent: nothing optional runs before a choice; "Reject all" is as easy as "Accept all";
 * the choice can be changed at any time (footer "Cookie settings") and is logged server-side as proof.
 * A browser Global Privacy Control signal counts as "reject all" without asking.
 */
export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const categories = useMemo(() => activeOptionalCategories(), [])
  const consent = useSyncExternalStore(subscribe, getSnapshot, () => undefined)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const persist = useCallback((choice: Choice, action: Action, source: ConsentState["source"]) => {
    const state: ConsentState = {
      id: getSnapshot()?.id ?? crypto.randomUUID(),
      version: POLICY_VERSION,
      categories: choice,
      at: new Date().toISOString(),
      source,
    }
    writeCookie(state)
    void recordConsent({ consentId: state.id, categories: choice, action })
  }, [])

  useEffect(() => {
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
    if (consent === null && gpc && categories.length) persist(NONE, "gpc", "gpc")
  }, [consent, categories, persist])

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      categories,
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      allows: (category) => Boolean(consent?.categories[category]),
      save: (choice, action) => {
        persist(choice, action, settingsOpen ? "settings" : "banner")
        setSettingsOpen(false)
      },
    }),
    [consent, categories, settingsOpen, persist],
  )

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent() {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error("useConsent must be used inside ConsentProvider")
  return ctx
}

/** Renders its children only once the visitor has allowed this category. */
export function ConsentGate({ category, children }: { category: OptionalCategory; children: React.ReactNode }) {
  const { allows } = useConsent()
  return allows(category) ? <>{children}</> : null
}
