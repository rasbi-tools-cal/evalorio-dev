"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Cookie } from "lucide-react"
import Link from "next/link"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem("cookie-consent", "all")
    setShowBanner(false)
  }

  const acceptNecessary = () => {
    localStorage.setItem("cookie-consent", "necessary")
    setShowBanner(false)
  }

  const rejectAll = () => {
    localStorage.setItem("cookie-consent", "none")
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <Card className="max-w-4xl mx-auto p-6 shadow-2xl border-2">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Cookie className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Cookie Preferences</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We use cookies to improve your experience on our site. Essential cookies are required for authentication
              and basic functionality. Analytics cookies help us understand how you use our platform.{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Learn more in our Privacy Policy
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={acceptAll} size="sm" className="gap-2">
                Accept All
              </Button>
              <Button onClick={acceptNecessary} size="sm" variant="outline">
                Essential Only
              </Button>
              <Button onClick={rejectAll} size="sm" variant="ghost">
                Reject All
              </Button>
            </div>
          </div>
          <Button onClick={rejectAll} variant="ghost" size="icon" className="flex-shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
