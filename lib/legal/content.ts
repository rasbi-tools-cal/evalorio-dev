import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Locale } from "@/i18n/routing"
import { SITE_URL } from "@/lib/env"
import { mapTileProvider } from "@/lib/consent/registry"
import { COMPANY, POLICY_VERSION } from "./company"
import { fillTokens } from "./markdown"

export const LEGAL_PAGES = ["privacy", "cookies", "legal-notice", "terms"] as const
export type LegalPage = (typeof LEGAL_PAGES)[number]

/** Markdown source in content/legal/<locale>/<page>.md with company tokens filled in. */
export async function loadLegal(locale: Locale, page: LegalPage) {
  const file = path.join(process.cwd(), "content", "legal", locale, `${page}.md`)
  const raw = await readFile(file, "utf8")
  const [, front = "", body = raw] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw.replace(/\r\n/g, "\n")) ?? []
  const meta = Object.fromEntries(
    front
      .split("\n")
      .map((l) => /^(\w+):\s*(.*)$/.exec(l))
      .filter((m): m is RegExpExecArray => Boolean(m))
      .map((m) => [m[1], m[2]]),
  ) as { title?: string; description?: string }

  const tokens: Record<string, string> = {
    brand: COMPANY.brand,
    legalName: COMPANY.legalName,
    legalForm: COMPANY.legalForm,
    address: COMPANY.address,
    country: COMPANY.country,
    registry: COMPANY.registry,
    vatId: COMPANY.vatId,
    supportEmail: COMPANY.supportEmail,
    privacyEmail: COMPANY.privacyEmail,
    dpo: COMPANY.dpo || COMPANY.privacyEmail,
    leadAuthority: COMPANY.leadAuthority,
    dataRegion: COMPANY.dataRegion,
    emailProvider: COMPANY.emailProvider,
    emailRegion: COMPANY.emailRegion,
    mapProvider: mapTileProvider(),
    siteUrl: SITE_URL,
    updated: POLICY_VERSION,
  }
  return { title: meta.title ?? page, description: meta.description ?? "", body: fillTokens(body, tokens) }
}
