import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Sparkles, Video, Check, Mail, Youtube } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { UserNav } from "@/components/user-nav"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Evalorio - AI Video & Image Scoring for Real Estate",
  description:
    "Upload property videos or images, get AI-powered analysis with room detection, quality scoring, location-based pricing, and auto-generated multilingual TikTok content in minutes.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Evalorio - AI Property Analysis Platform",
    description:
      "Upload property videos or images, get AI-powered analysis with room detection, quality scoring, and auto-generated TikTok content in minutes.",
    url: "/",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Evalorio - AI Property Analysis Platform",
      },
    ],
  },
}

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Image src="/evalorio-logo.svg" alt="Evalorio" width={163} height={30} className="h-7 w-auto" priority />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              {user ? (
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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Column - Text */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] tracking-tight text-foreground mb-6">
                AI Scoring for Real Estate – Upload Videos or Images, Get Results in 1 Minute
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Evalorio analyzes your property videos and images using AI: detects rooms, estimates surfaces, scores quality, and generates marketing content automatically.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <Link href={user ? "/dashboard/upload" : "/auth/sign-up"}>
                  <Button size="lg" className="bg-[#4169E1] hover:bg-[#3457c9] text-base px-6 h-12 gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Video or Images
                  </Button>
                </Link>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/50">
                <Sparkles className="w-4 h-4 text-[#4169E1]" />
                <span className="text-sm font-medium text-[#4169E1]">AI-Powered Video & Image Analysis</span>
              </div>
            </div>

            {/* Right Column - Building Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <Image
                  src="/images/header-hero-v5.webp"
                  alt="Modern apartment building"
                  width={550}
                  height={700}
                  className="w-full max-w-md lg:max-w-lg h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl text-foreground mb-6 text-balance font-normal">How it Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Get professional property analysis in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            {/* Cleaner step cards without heavy borders */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg shadow-blue-600/20">
                1
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Upload</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Drag and drop your property video or images. We accept MP4, MOV videos and JPG, PNG images.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg shadow-blue-600/20">
                2
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">AI Analysis</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Our AI detects rooms, estimates surfaces, evaluates finishes, and calculates property scores in
                real-time.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg shadow-blue-600/20">
                3
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">Get Results</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Download your media with auto-generated captions, titles, and hashtags ready for social media.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl text-foreground mb-6 text-balance font-normal">
              Best Features <span className="text-blue-600">Always</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Everything you need to create professional property content
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">AI Scoring</h3>
              <p className="text-muted-foreground leading-relaxed">
                Intelligent scoring based on quality, condition, lighting, and marketability
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Room Detection</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automatically identifies bedrooms, bathrooms, kitchens, and living areas
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Price Estimates</h3>
              <p className="text-muted-foreground leading-relaxed">
                Location-based pricing with market data from 30+ countries
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Video className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Marketing Content</h3>
              <p className="text-muted-foreground leading-relaxed">
                Auto-generated descriptions, titles, and hashtags in 16+ languages
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl text-foreground mb-4 text-balance font-normal">
              Powered by <span className="text-blue-600">Real Market Data</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Our AI analyzes data from leading real estate platforms worldwide
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center opacity-60">
            {/* Platform logos would go here */}
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Zillow</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Rightmove</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">ImmoScout24</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">SeLoger</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Idealista</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Immobiliare</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-foreground mb-4 text-balance text-5xl font-light">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Pay per analysis. No subscriptions, no hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Trial */}
            <Card className="p-8 bg-card border-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Try it Free</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-foreground">1</span>
                  <span className="text-muted-foreground">credit free</span>
                </div>
                <p className="text-sm text-muted-foreground">Perfect to test our AI analysis</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>1 video or image set analysis</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Full AI scoring</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Marketing content generation</span>
                </li>
              </ul>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full bg-transparent">
                  Sign Up Free
                </Button>
              </Link>
            </Card>

            {/* Pay as you go */}
            <Card className="p-8 bg-card border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Pay as You Go</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-foreground">€5</span>
                  <span className="text-muted-foreground">per credit</span>
                </div>
                <p className="text-sm text-muted-foreground">Perfect for occasional use</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>1 video or image set analysis</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Full AI scoring</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Marketing content generation</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>No expiration</span>
                </li>
              </ul>
              <Link href={user ? "/pricing" : "/auth/sign-up"}>
                <Button className="w-full">Buy Credits</Button>
              </Link>
            </Card>

            {/* Bulk */}
            <Card className="p-8 bg-card border-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Bulk Package</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-foreground">€40</span>
                  <span className="text-muted-foreground">for 10 credits</span>
                </div>
                <p className="text-sm text-muted-foreground">Save 20% with bulk purchase</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>10 video or image set analyses</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>€4 per analysis</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>All features included</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Link href={user ? "/pricing" : "/auth/sign-up"}>
                <Button variant="outline" className="w-full bg-transparent">
                  Buy Bulk
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-12 lg:p-20 text-center shadow-2xl">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white text-balance">
                Ready to Transform Your Property Content?
              </h2>
              <p className="text-xl mb-10 text-white/90 text-pretty">
                Join real estate professionals using AI to create better content faster
              </p>
              {user ? (
                <Link href="/upload">
                  <Button size="lg" variant="secondary" className="text-base px-8 h-12">
                    Upload Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/sign-up">
                  <Button size="lg" variant="secondary" className="text-base px-8 h-12">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="grid md:grid-cols-4 gap-8 mb-2.5">
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <Image src="/evalorio-logo.svg" alt="Evalorio" width={196} height={36} className="h-9 w-auto" />
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-4">
                AI-powered video and image analysis for real estate professionals. Get instant property scores, room
                detection, and marketing content.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="mailto:hello@evalorio.com"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  hello@evalorio.com
                </a>
                <div className="flex items-center gap-4">
                  <a
                    href="https://www.youtube.com/@EvalorioApp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/evalorio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/evalorio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="X (Twitter)"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="#features"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/upload"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Upload
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 pt-2.5">
            <div>
              <a
                href="https://www.producthunt.com/products/evalorio?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-evalorio"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1045557&theme=dark&t=1764762816749"
                  alt="Evalorio - AI property scoring and instant TikTok-ready listing videos | Product Hunt"
                  style={{ width: "162px", height: "35px" }}
                  width={162}
                  height={35}
                />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 Evalorio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
