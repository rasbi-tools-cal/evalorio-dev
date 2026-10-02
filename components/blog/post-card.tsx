import { ArrowRight } from "lucide-react"
import { Link } from "@/i18n/navigation"

/** Article teaser for the blog list. The whole card is clickable via the title link. */
export function BlogPostCard({
  href,
  title,
  description,
  date,
  readingTime,
  countries,
  audience,
  cta,
}: {
  href: string
  title: string
  description: string
  date: string
  readingTime: string
  countries: string[]
  audience: string[]
  cta: string
}) {
  return (
    <article className="bg-card hover:border-primary/40 group relative flex h-full flex-col rounded-xl border p-5 shadow-[var(--shadow-card)] transition-colors">
      <div className="flex flex-wrap gap-1.5">
        {[...countries, ...audience].map((label) => (
          <span key={label} className="bg-surface text-subtle-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
            {label}
          </span>
        ))}
      </div>
      <h2 className="mt-3 text-lg leading-snug font-semibold">
        <Link href={href} className="group-hover:text-primary after:absolute after:inset-0 focus-visible:outline-none">
          {title}
        </Link>
      </h2>
      <p className="text-subtle-foreground mt-2 line-clamp-3 text-sm">{description}</p>
      <div className="text-muted-foreground mt-auto flex items-center justify-between gap-3 pt-5 text-xs">
        <span>
          {date} · {readingTime}
        </span>
        <span className="text-primary inline-flex items-center gap-1 font-semibold">
          {cta} <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </div>
    </article>
  )
}
