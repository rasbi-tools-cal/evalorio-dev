/**
 * Legal identity of the operator, used by the legal notice, privacy policy, terms, emails and the
 * consent banner. Fill these in (env vars) before launch; empty values render as [placeholders] so
 * missing details are visible instead of silently wrong.
 */
// Static process.env.X reads: Next.js only inlines NEXT_PUBLIC_* values written out literally.
const value = (v: string | undefined, placeholder: string) => v?.trim() || `[${placeholder}]`

export const COMPANY = {
  brand: "Evalorio",
  /** Always the production domain in legal texts, whatever environment renders them. */
  website: "evalorio.com",
  legalName: process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME?.trim() || "Evalorio",
  legalForm: value(process.env.NEXT_PUBLIC_COMPANY_LEGAL_FORM, "Legal form, e.g. S.L."),
  address: value(process.env.NEXT_PUBLIC_COMPANY_ADDRESS, "Registered address"),
  country: value(process.env.NEXT_PUBLIC_COMPANY_COUNTRY, "Country of establishment"),
  registry: value(process.env.NEXT_PUBLIC_COMPANY_REGISTRY, "Commercial register and registration number"),
  vatId: value(process.env.NEXT_PUBLIC_COMPANY_VAT_ID, "VAT / tax ID"),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@evalorio.com",
  privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL?.trim() || "privacy@evalorio.com",
  /** Optional: a DPO is not mandatory for every company (Art. 37 GDPR). */
  dpo: process.env.NEXT_PUBLIC_COMPANY_DPO?.trim() || "",
  /** Where the Supabase project stores data (Supabase dashboard → Project Settings → General → Region). */
  dataRegion: value(process.env.NEXT_PUBLIC_DATA_REGION, "Database region, e.g. EU – Frankfurt"),
  /** Outgoing email provider and where it processes data. */
  emailProvider: value(process.env.NEXT_PUBLIC_EMAIL_PROVIDER, "Email provider name"),
  emailRegion: value(process.env.NEXT_PUBLIC_EMAIL_REGION, "Email provider region"),
  /** Lead supervisory authority (where the company is established). */
  leadAuthority: value(process.env.NEXT_PUBLIC_LEAD_AUTHORITY, "Lead supervisory authority"),
} as const

/** Data protection authorities of the countries we serve (people can complain to any of them). */
export const AUTHORITIES = [
  { country: "ES", name: "Agencia Española de Protección de Datos (AEPD)", url: "https://www.aepd.es" },
  { country: "FR", name: "Commission Nationale de l'Informatique et des Libertés (CNIL)", url: "https://www.cnil.fr" },
  { country: "IT", name: "Garante per la protezione dei dati personali", url: "https://www.garanteprivacy.it" },
  { country: "PT", name: "Comissão Nacional de Proteção de Dados (CNPD)", url: "https://www.cnpd.pt" },
] as const

/** Bump when the privacy or cookie policy changes materially: stored consents are asked again. */
export const POLICY_VERSION = "2026-10-01"
