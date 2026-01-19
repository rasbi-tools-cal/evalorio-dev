import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - Evalorio",
  description: "Sign in to your Evalorio account to access AI-powered property analysis.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
