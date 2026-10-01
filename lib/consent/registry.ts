/**
 * Single source of truth for everything stored on, or read from, the visitor's device.
 * The consent banner, the preferences dialog and the cookie policy table are all generated from it,
 * so adding a tool means adding it here first (and gating it with <ConsentGate>).
 */
import { AUTH_COOKIE_NAME, MAP_TILE_URL } from "@/lib/env"

export const CONSENT_CATEGORIES = ["necessary", "preferences", "analytics", "marketing"] as const
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number]
export type OptionalCategory = Exclude<ConsentCategory, "necessary">

export interface DeviceItem {
  /** Exact cookie / storage key. Network items (no storage) are shown by their translated name. */
  name: string
  provider: string
  /** First party = set by evalorio's own domain. */
  party: "first" | "third"
  type: "cookie" | "localStorage" | "network"
  category: ConsentCategory
  /** i18n key under consent.items.<key> (purpose, duration and, for network items, name). */
  key: string
  /** Optional analytics/marketing tools are only active when this env flag is set. */
  enabledWhen?: () => boolean
}

// On by default (set NEXT_PUBLIC_ANALYTICS=off to remove it); it only ever loads after consent.
const analyticsOn = () => process.env.NEXT_PUBLIC_ANALYTICS !== "off"

const KNOWN_TILE_PROVIDERS: Record<string, string> = {
  "tile.openstreetmap.org": "OpenStreetMap Foundation",
  "api.maptiler.com": "MapTiler AG",
  "tiles.stadiamaps.com": "Stadia Maps",
  "api.mapbox.com": "Mapbox, Inc.",
}

export function mapTileProvider() {
  try {
    const host = new URL(MAP_TILE_URL.replace(/\{[a-z]\}/g, "0")).hostname
    return KNOWN_TILE_PROVIDERS[host] ?? host
  } catch {
    return "OpenStreetMap Foundation"
  }
}

const AUTH_COOKIE = AUTH_COOKIE_NAME

export const DEVICE_ITEMS: DeviceItem[] = [
  { name: AUTH_COOKIE, provider: "Evalorio", party: "first", type: "cookie", category: "necessary", key: "authToken" },
  { name: `${AUTH_COOKIE}-code-verifier`, provider: "Evalorio", party: "first", type: "cookie", category: "necessary", key: "authVerifier" },
  { name: "evalorio_consent", provider: "Evalorio", party: "first", type: "cookie", category: "necessary", key: "consent" },
  { name: "turnstile", provider: "Cloudflare, Inc.", party: "third", type: "network", category: "necessary", key: "turnstile" },
  { name: "mapTiles", provider: mapTileProvider(), party: "third", type: "network", category: "necessary", key: "mapTiles" },
  {
    name: "vercelAnalytics",
    provider: "Vercel Inc.",
    party: "third",
    type: "network",
    category: "analytics",
    key: "vercelAnalytics",
    enabledWhen: analyticsOn,
  },
]

export const activeItems = () => DEVICE_ITEMS.filter((i) => !i.enabledWhen || i.enabledWhen())

/** Optional categories that actually have something behind them (others are not offered at all). */
export const activeOptionalCategories = (): OptionalCategory[] =>
  (CONSENT_CATEGORIES.filter((c) => c !== "necessary") as OptionalCategory[]).filter((c) => activeItems().some((i) => i.category === c))

export const CONSENT_COOKIE = "evalorio_consent"
/** AEPD allows at most 24 months; we ask again after 12 (or when POLICY_VERSION changes). */
export const CONSENT_MAX_AGE_DAYS = 365

export interface ConsentState {
  /** Random id linking the choice to its server-side proof record. */
  id: string
  version: string
  categories: Record<OptionalCategory, boolean>
  /** ISO date of the choice. */
  at: string
  source: "banner" | "settings" | "gpc"
}
