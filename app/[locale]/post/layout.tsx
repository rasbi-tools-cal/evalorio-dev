import type { Metadata } from "next"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface min-h-[70vh] py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">{children}</div>
    </div>
  )
}
