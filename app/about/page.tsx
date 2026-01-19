import type { Metadata } from "next"
import Link from "next/link"
import { Sparkles, Target, Users, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "About Us | Evalorio",
  description:
    "Learn about Evalorio's mission to revolutionize real estate marketing with AI-powered property analysis.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />

      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl text-foreground mb-6 font-light">Revolutionizing Real Estate with AI</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Evalorio empowers real estate professionals with AI-powered property analysis, instant scoring, and
              TikTok-ready marketing content—all in under 2 minutes.
            </p>
          </div>

          {/* Mission Section */}
          <div className="mb-16">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="text-center">
                <Target className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-3xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-center text-muted-foreground max-w-3xl mx-auto">
                  To make professional property analysis accessible to everyone. We believe every real estate agent,
                  homeowner, and investor deserves instant, AI-powered insights that help them make better decisions and
                  create compelling marketing content effortlessly.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Why Choose Evalorio */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-foreground mb-8">Why Choose Evalorio?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Zap className="w-10 h-10 text-primary mb-3" />
                  <CardTitle>Lightning Fast</CardTitle>
                  <CardDescription>
                    Get comprehensive property analysis and marketing content in under 2 minutes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our advanced AI processes videos and images instantly, detecting rooms, analyzing quality, and
                    generating professional descriptions in 30+ languages.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Sparkles className="w-10 h-10 text-primary mb-3" />
                  <CardTitle>AI-Powered Intelligence</CardTitle>
                  <CardDescription>Cutting-edge computer vision and natural language processing</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Leveraging state-of-the-art AI models to provide accurate property scores, room detection, quality
                    assessment, and market-ready content generation.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="w-10 h-10 text-primary mb-3" />
                  <CardTitle>Built for Professionals</CardTitle>
                  <CardDescription>Trusted by real estate agents and agencies worldwide</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    From individual agents to large agencies, Evalorio streamlines your workflow and helps you close
                    deals faster with professional marketing materials.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Our Story */}
          <div className="mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Our Story</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Evalorio was born from a simple observation: real estate professionals spend countless hours manually
                  analyzing properties, writing descriptions, and creating marketing content. We knew there had to be a
                  better way.
                </p>
                
                <p className="text-muted-foreground">
                  Today, Evalorio serves real estate professionals across 30+ countries, analyzing thousands of
                  properties and generating marketing content in multiple languages. We're proud to be at the forefront
                  of AI-powered real estate technology.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Global Reach */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-foreground mb-8">Global Reach</h2>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">30+</div>
                  <div className="text-sm text-muted-foreground">Countries Supported</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">16</div>
                  <div className="text-sm text-muted-foreground">Languages</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">&lt;2min</div>
                  <div className="text-sm text-muted-foreground">Average Analysis Time</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">AI Processing</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Ready to Transform Your Real Estate Business?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join thousands of real estate professionals who trust Evalorio to analyze properties and create
                  compelling marketing content in minutes.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/auth/sign-up">
                    <Button size="lg">Get Started Free</Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
