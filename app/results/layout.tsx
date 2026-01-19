import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analysis Results - Evalorio",
  description: "View your AI-powered property analysis results with scoring, room detection, and marketing content.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
