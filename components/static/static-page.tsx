/** Long-form content pages. Content is authored in English for now (see lib/static-content.tsx). */
export function StaticPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="page-container max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {updated && <p className="text-muted-foreground mt-2 text-sm">{updated}</p>}
      <div className="prose-evalorio mt-8">{children}</div>
    </article>
  )
}
