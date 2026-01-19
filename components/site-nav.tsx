"use client"

import Link from "next/link"
import Image from "next/image"
import { UserNav } from "./user-nav"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function SiteNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Image src="/evalorio-logo.svg" alt="Evalorio" width={163} height={30} className="h-7 w-auto" priority />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard/upload">
                  <Button size="sm" className="bg-[#4169E1] hover:bg-[#3457c9]">
                    Upload Video or Images
                  </Button>
                </Link>
                <UserNav />
              </>
            ) : (
              <>
                <Link href="/dashboard/upload">
                  <Button size="sm" className="bg-[#4169E1] hover:bg-[#3457c9]">
                    Upload Video or Images
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
