import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Locale } from "@/i18n/routing"
import { mapTileProvider } from "@/lib/consent/registry"
import { COMPANY, POLICY_VERSION } from "./company"
import { fillTokens } from "./markdown"

export const LEGAL_PAGES = ["privacy", "cookies", "legal-notice", "terms"] as const
export type LegalPage = (typeof LEGAL_PAGES)[number]

// Company details, phrased per language; left out entirely until all of them are configured.
const CONTROLLER_DETAILS: Record<Locale, string> = {
  en: ' ({legalForm}), {address}, {country}, registered in {registry}, tax ID {vatId} ("{brand}", "we")',
  es: " ({legalForm}), {address}, {country}, inscrita en {registry}, NIF {vatId} («{brand}», «nosotros»)",
  fr: " ({legalForm}), {address}, {country}, immatriculée au {registry}, numéro fiscal {vatId} (« {brand} », « nous »)",
  it: " ({legalForm}), {address}, {country}, iscritta al {registry}, codice fiscale / partita IVA {vatId} («{brand}», «noi»)",
  pt: " ({legalForm}), {address}, {country}, registada em {registry}, NIF {vatId} («{brand}», «nós»)",
}

function controllerDetails(locale: Locale) {
  const fields = { legalForm: COMPANY.legalForm, address: COMPANY.address, country: COMPANY.country, registry: COMPANY.registry, vatId: COMPANY.vatId }
  if (Object.values(fields).some((v) => v.startsWith("["))) return ""
  return CONTROLLER_DETAILS[locale].replace(/\{(\w+)\}/g, (_, k: string) => (k === "brand" ? COMPANY.brand : fields[k as keyof typeof fields]))
}

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
    siteUrl: COMPANY.website,
    updated: POLICY_VERSION,
    controllerDetails: controllerDetails(locale),
  }
  return { title: meta.title ?? page, description: meta.description ?? "", body: fillTokens(body, tokens) }
}
