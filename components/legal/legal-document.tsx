import { getTranslations } from "next-intl/server"
import { CookieSettingsButton } from "@/components/consent/consent-ui"
import type { Locale } from "@/i18n/routing"
import { activeItems } from "@/lib/consent/registry"
import { AUTHORITIES } from "@/lib/legal/company"
import { loadLegal, type LegalPage } from "@/lib/legal/content"
import { renderLegalMarkdown } from "@/lib/legal/markdown"

async function CookieTable() {
  const t = await getTranslations("consent")
  return (
    <div className="legal-table">
      <table>
        <thead>
          <tr>
            <th scope="col">{t("table.name")}</th>
            <th scope="col">{t("table.provider")}</th>
            <th scope="col">{t("table.purpose")}</th>
            <th scope="col">{t("table.duration")}</th>
            <th scope="col">{t("table.category")}</th>
          </tr>
        </thead>
        <tbody>
          {activeItems().map((i) => (
            <tr key={i.key}>
              <td>
                {i.type === "network" ? t(`items.${i.key}.name`) : <code>{i.name}</code>}
                <span className="text-muted-foreground block text-xs">
                  {t(`table.${i.type}`)} · {t(`table.${i.party}`)}
                </span>
              </td>
              <td>{i.provider}</td>
              <td>{t(`items.${i.key}.purpose`)}</td>
              <td>{t(`items.${i.key}.duration`)}</td>
              <td>{t(`categories.${i.category}.title`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Legal page body from content/legal/<locale>/<page>.md, with live blocks (cookie table, settings button…). */
export async function LegalDocument({ locale, page }: { locale: Locale; page: LegalPage }) {
  const doc = await loadLegal(locale, page)
  const t = await getTranslations("consent")
  const blocks = {
    cookieTable: <CookieTable />,
    cookieSettings: (
      <p>
        <CookieSettingsButton
          label={t("openSettings")}
          className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold"
        />
      </p>
    ),
    authorities: (
      <ul>
        {AUTHORITIES.map((a) => (
          <li key={a.country}>
            <a href={a.url} rel="noopener noreferrer" target="_blank">
              {a.name}
            </a>
          </li>
        ))}
      </ul>
    ),
  }

  return (
    <article className="page-container max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{doc.title}</h1>
      <div className="prose-evalorio mt-6">{renderLegalMarkdown(doc.body, blocks)}</div>
    </article>
  )
}

export async function legalMetadata(locale: Locale, page: LegalPage) {
  const doc = await loadLegal(locale, page)
  return { title: doc.title, description: doc.description }
}
