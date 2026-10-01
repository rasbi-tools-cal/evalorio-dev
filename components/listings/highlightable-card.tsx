"use client"

import { useResultsHighlight } from "@/components/search/results-highlight"

/** Card wrapper that reports hover to the results map and highlights itself when its pin is hovered. */
export function HighlightableCard({
  listingId,
  className,
  children,
}: {
  listingId: number
  className?: string
  children: React.ReactNode
}) {
  const { activeId, setActiveId } = useResultsHighlight()
  return (
    <article
      className={className}
      data-active={activeId === listingId}
      onMouseEnter={() => setActiveId(listingId)}
      onMouseLeave={() => setActiveId(null)}
      onFocusCapture={() => setActiveId(listingId)}
    >
      {children}
    </article>
  )
}
