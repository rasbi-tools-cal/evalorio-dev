import Link from "next/link"
import { fontVariables } from "@/lib/fonts"

/** 404 outside a valid language segment (e.g. /xx/...). Renders its own <html>, like the locale layout. */
export default function RootNotFound() {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh">
        <main className="page-container flex flex-col items-center py-24 text-center">
          <p className="text-primary font-heading text-6xl font-bold">404</p>
          <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
          <p className="text-muted-foreground mt-2 max-w-md">The page you are looking for doesn&apos;t exist or has moved.</p>
          <Link href="/" className="bg-primary text-primary-foreground hover:bg-primary-hover mt-8 inline-flex h-10 items-center rounded-md px-5 text-sm font-semibold">
            Back to Evalorio
          </Link>
        </main>
      </body>
    </html>
  )
}
