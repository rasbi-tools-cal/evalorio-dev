"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Upload, FileText, CreditCard, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface DashboardSidebarProps {
  displayName?: string | null
  email: string
  credits: number
}

export function DashboardSidebar({ displayName, email, credits }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Upload", href: "/dashboard/upload", icon: Upload },
    { name: "My Analyses", href: "/dashboard/analyses", icon: FileText },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ]

  return (
    <div className="flex flex-col h-full border-r border-border bg-background">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/evalorio-logo.svg" alt="Evalorio" width={136} height={28} className="h-7 w-auto" />
        </Link>
      </div>

      {/* Credits */}
      <div className="px-4 py-4">
        <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Credits</span>
            <CreditCard className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground">{credits}</div>
          <Link href="/pricing">
            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary">
              Buy more →
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName || email}</p>
            <p className="text-xs text-muted-foreground truncate">{displayName ? email : "User"}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full mt-2 justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
