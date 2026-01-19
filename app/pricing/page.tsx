import Link from "next/link"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { UserNav } from "@/components/user-nav"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing - Evalorio",
  description:
    "Simple, transparent pricing for AI property analysis. Pay per credit with no subscriptions. Start with 1 free credit.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Evalorio Pricing - Pay Per Analysis",
    description: "Get AI property analysis starting at €5 per credit. No subscriptions, credits never expire.",
    url: "/pricing",
  },
}

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">Evalorio</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/upload">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Upload
                </Button>
              </Link>
              <UserNav />
            </div>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Purchase Analysis Credits
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Choose the plan that works best for you. No subscriptions, credits never expire.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Single Credit */}
          <Card className="p-8 bg-card border-2">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Single Analysis</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-foreground">€5</span>
                <span className="text-muted-foreground">per credit</span>
              </div>
              <p className="text-sm text-muted-foreground">Perfect for occasional use</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>1 video analysis</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Full AI scoring & room detection</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>TikTok-ready video + captions</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>No expiration</span>
              </li>
            </ul>
            <Button className="w-full" size="lg">
              Buy 1 Credit - €5
            </Button>
          </Card>

          {/* Bulk Package */}
          <Card className="p-8 bg-card border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Save 20%
              </span>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Bulk Package</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-foreground">€40</span>
                <span className="text-muted-foreground">for 10 credits</span>
              </div>
              <p className="text-sm text-muted-foreground">Just €4 per analysis</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>10 video analyses</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>All features included</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>No expiration</span>
              </li>
            </ul>
            <Button className="w-full" size="lg">
              Buy 10 Credits - €40
            </Button>
          </Card>
        </div>

        {/* Payment Info */}
        <Card className="mt-8 p-6 bg-muted/30">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Secure payment processing powered by Stripe</p>
            <p className="text-xs text-muted-foreground">
              Credits are added instantly to your account and never expire
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
