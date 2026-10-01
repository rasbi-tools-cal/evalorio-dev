"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

export function AdminNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap",
              active ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
