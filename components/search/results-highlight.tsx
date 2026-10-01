"use client"

import { createContext, useContext, useMemo, useState } from "react"

/** Which result is "active" (hovered), shared between result cards and the map pins. */
const HighlightContext = createContext<{ activeId: number | null; setActiveId: (id: number | null) => void }>({
  activeId: null,
  setActiveId: () => {},
})

export function ResultsHighlightProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const value = useMemo(() => ({ activeId, setActiveId }), [activeId])
  return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>
}

export function useResultsHighlight() {
  return useContext(HighlightContext)
}
