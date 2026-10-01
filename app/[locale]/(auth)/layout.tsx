import type { Metadata } from "next"

export const metadata: Metadata = { robots: { index: false, follow: true } }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface flex justify-center px-4 py-10 sm:py-16">
      <div className="bg-card w-full max-w-md rounded-xl border p-6 shadow-[var(--shadow-card)] sm:p-8">{children}</div>
    </div>
  )
}
