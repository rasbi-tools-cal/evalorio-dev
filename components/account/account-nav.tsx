"use client"

import { Bell, Heart, Home, Mail, Settings } from "lucide-react"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const ICONS = { home: Home, heart: Heart, bell: Bell, mail: Mail, settings: Settings }

export function AccountNav({ items, label }: { items: { href: string; label: string; icon: keyof typeof ICONS }[]; label: string }) {
  const pathname = usePathname()
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((item) => {
          const Icon = ICONS[item.icon]
          const active = pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium whitespace-nowrap",
                  active ? "bg-primary-soft text-primary-soft-foreground" : "text-subtle-foreground hover:bg-surface-low",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
