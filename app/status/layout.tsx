import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Processing Status - Evalorio",
  description: "Track the real-time processing status of your property video or image analysis.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
