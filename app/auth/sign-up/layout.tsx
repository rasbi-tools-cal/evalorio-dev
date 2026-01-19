import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up - Evalorio",
  description: "Create your Evalorio account and get 1 free property analysis credit.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
