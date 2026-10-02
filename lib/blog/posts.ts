import "server-only"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { cache } from "react"
import { parse } from "yaml"
import { z } from "zod"
import { routing, type Locale } from "@/i18n/routing"
import { COUNTRY_CODES } from "@/lib/catalog"

/**
 * Blog articles live in content/blog/<locale>/<slug>.mdx. The YAML frontmatter is read here (lists,
 * metadata, hreflang, sitemap); the body is rendered by importing the .mdx file (@next/mdx).
 * Translations of the same article share a translationKey; each language can have its own slug.
 */

export const AUDIENCES = ["buyers", "renters", "owners"] as const
export type Audience = (typeof AUDIENCES)[number]

const CONTENT_DIR = path.join(process.cwd(), "content", "blog")
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD")

const frontmatterSchema = z.object({
  title: z.string().min(10).max(120),
  description: z.string().min(50).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase words separated by hyphens"),
  translationKey: z.string().regex(/^[a-z0-9-]+$/),
  date: isoDate,
  updated: isoDate.optional(),
  countries: z.array(z.enum(COUNTRY_CODES)).min(1),
  audience: z.array(z.enum(AUDIENCES)).min(1),
  tags: z.array(z.string().min(2).max(40)).default([]),
  faq: z.array(z.object({ q: z.string().min(5), a: z.string().min(5) })).default([]),
  sources: z
    .array(z.object({ title: z.string().min(3), url: z.url({ protocol: /^https$/ }), accessed: isoDate }))
    .default([]),
})

export type PostMeta = z.infer<typeof frontmatterSchema> & {
  locale: Locale
  /** File name without extension (equals slug, enforced below). */
  file: string
  readingMinutes: number
}

function splitFrontmatter(source: string, file: string) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source)
  if (!match) throw new Error(`${file}: missing YAML frontmatter`)
  return { data: parse(match[1]) as unknown, body: match[2] }
}

async function readLocale(locale: Locale): Promise<PostMeta[]> {
  const dir = path.join(CONTENT_DIR, locale)
  const files = (await readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith(".mdx"))
  return Promise.all(
    files.map(async (name) => {
      const file = name.slice(0, -".mdx".length)
      const where = `content/blog/${locale}/${name}`
      const { data, body } = splitFrontmatter(await readFile(path.join(dir, name), "utf8"), where)
      const parsed = frontmatterSchema.safeParse(data)
      if (!parsed.success) throw new Error(`${where}: invalid frontmatter\n${z.prettifyError(parsed.error)}`)
      if (parsed.data.slug !== file) throw new Error(`${where}: file name must equal the slug "${parsed.data.slug}"`)
      const words = body.replace(/[#*_>`|[\]()-]/g, " ").split(/\s+/).filter(Boolean).length
      return { ...parsed.data, locale, file, readingMinutes: Math.max(1, Math.round(words / 220)) }
    }),
  )
}

/** Every article in every language, newest first. Cached per request. */
export const getAllPosts = cache(async (): Promise<PostMeta[]> => {
  const all = (await Promise.all(routing.locales.map(readLocale))).flat()
  return all.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
})

export async function getPosts(locale: Locale) {
  return (await getAllPosts()).filter((p) => p.locale === locale)
}

export async function getPost(locale: Locale, slug: string) {
  return (await getAllPosts()).find((p) => p.locale === locale && p.slug === slug) ?? null
}

/** The same article in every language it actually exists in (including itself). */
export async function getTranslations(post: PostMeta) {
  return (await getAllPosts()).filter((p) => p.translationKey === post.translationKey)
}

/** Languages with at least one article (for /blog hreflang and the sitemap). */
export async function blogLocales() {
  const all = await getAllPosts()
  return routing.locales.filter((l) => all.some((p) => p.locale === l))
}

export const blogPath = (slug?: string) => (slug ? `/blog/${slug}` : "/blog")

/** Renders the article body (the .mdx file compiled by @next/mdx). */
export async function loadPostBody(post: PostMeta) {
  const mod = (await import(`@/content/blog/${post.locale}/${post.file}.mdx`)) as { default: React.ComponentType }
  return mod.default
}
