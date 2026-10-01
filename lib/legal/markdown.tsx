import { Fragment, type ReactNode } from "react"
import { Link } from "@/i18n/navigation"

/**
 * Minimal, safe Markdown renderer for the legal pages (no raw HTML, ever):
 * ## / ### headings, paragraphs, "-" lists, "|" tables, **bold**, [links](url), and block
 * placeholders like {{cookieTable}} that the page replaces with components.
 */

type Blocks = Record<string, ReactNode>

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const key = `${keyPrefix}-${i++}`
    if (m[1]) out.push(<strong key={key}>{m[1]}</strong>)
    else {
      const [, , label, href] = m
      if (href.startsWith("/")) out.push(<Link key={key} href={href}>{label}</Link>)
      else if (/^(https:\/\/|mailto:)/.test(href)) out.push(<a key={key} href={href} rel="noopener noreferrer" target={href.startsWith("http") ? "_blank" : undefined}>{label}</a>)
      else out.push(label)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export function renderLegalMarkdown(source: string, blocks: Blocks = {}): ReactNode {
  const lines = source.replace(/\r\n/g, "\n").split("\n")
  const nodes: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i].trimEnd()
    if (!line.trim()) {
      i++
      continue
    }
    const block = /^\{\{(\w+)\}\}$/.exec(line.trim())
    if (block) {
      nodes.push(<Fragment key={key++}>{blocks[block[1]] ?? null}</Fragment>)
      i++
      continue
    }
    const heading = /^(#{2,3})\s+(.*)$/.exec(line)
    if (heading) {
      const Tag = heading[1].length === 2 ? "h2" : "h3"
      nodes.push(
        <Tag key={key++} id={slug(heading[2])}>
          {inline(heading[2], `h${key}`)}
        </Tag>,
      )
      i++
      continue
    }
    if (line.startsWith("- ")) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith("- ")) items.push(lines[i++].slice(2))
      nodes.push(
        <ul key={key++}>
          {items.map((it, n) => (
            <li key={n}>{inline(it, `li${key}-${n}`)}</li>
          ))}
        </ul>,
      )
      continue
    }
    if (line.startsWith("|")) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())
        if (!cells.every((c) => /^:?-{3,}:?$/.test(c))) rows.push(cells)
        i++
      }
      const [head, ...body] = rows
      nodes.push(
        <div key={key++} className="legal-table">
          <table>
            <thead>
              <tr>
                {head.map((c, n) => (
                  <th key={n} scope="col">
                    {inline(c, `th${key}-${n}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, rn) => (
                <tr key={rn}>
                  {r.map((c, n) => (
                    <td key={n}>{inline(c, `td${key}-${rn}-${n}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|- |\||\{\{\w+\}\}$)/.test(lines[i].trim())) para.push(lines[i++].trim())
    nodes.push(<p key={key++}>{inline(para.join(" "), `p${key}`)}</p>)
  }
  return nodes
}

/** Replaces {{company.field}}-style tokens with values. Unknown tokens stay visible. */
export function fillTokens(source: string, values: Record<string, string>) {
  return source.replace(/\{\{(\w+)\}\}/g, (match, name: string) => (name in values ? values[name] : match))
}
