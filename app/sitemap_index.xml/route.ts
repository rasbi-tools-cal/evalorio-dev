import { generateSitemaps } from "@/app/sitemap"
import { SITE_URL } from "@/lib/env"

export const revalidate = 3600

/** Sitemap index: one URL to submit to search engines, listing every chunk of app/sitemap.ts. */
export async function GET() {
  const chunks = await generateSitemaps()
  const now = new Date().toISOString()
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunks.map(({ id }) => `  <sitemap><loc>${SITE_URL}/sitemap/${id}.xml</loc><lastmod>${now}</lastmod></sitemap>`).join("\n")}
</sitemapindex>
`
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
