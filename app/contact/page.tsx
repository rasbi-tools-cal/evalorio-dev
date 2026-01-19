import type { Metadata } from "next"
import Link from "next/link"
import { Mail, Youtube } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Contact Us | Evalorio",
  description: "Get in touch with the Evalorio team for support, questions, or business inquiries.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about Evalorio? We're here to help. Reach out to us through any of the channels below.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Email Us
                </CardTitle>
                <CardDescription>Send us an email and we'll get back to you within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <a href="mailto:hello@evalorio.com" className="text-lg font-medium text-primary hover:underline">
                  hello@evalorio.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-primary" />
                  Follow Us
                </CardTitle>
                <CardDescription>Connect with us on social media for updates and tutorials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <a
                    href="https://www.youtube.com/@EvalorioApp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-2"
                  >
                    <Youtube className="w-4 h-4" />
                    YouTube Channel
                  </a>
                </div>
                <div>
                  <a
                    href="https://www.linkedin.com/company/evalorio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">How do I get started with Evalorio?</h3>
                <p className="text-sm text-muted-foreground">
                  Simply sign up for an account, upload your property video or images, and our AI will analyze it within
                  minutes. You'll receive a comprehensive property score and marketing content.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">What types of files can I upload?</h3>
                <p className="text-sm text-muted-foreground">
                  We support video files (MP4, MOV, AVI) and image files (JPG, PNG, HEIC). Videos can be up to 500MB and
                  images up to 50MB each.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">How long does the analysis take?</h3>
                <p className="text-sm text-muted-foreground">
                  Most analyses complete within 1-2 minutes. The processing time depends on the size and quality of your
                  uploaded media.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Can I use Evalorio for commercial purposes?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! Evalorio is designed for real estate professionals. All generated content can be used for
                  commercial marketing purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">Ready to get started?</p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg">Sign Up Free</Button>
              </Link>
              <Link href="/upload">
                <Button size="lg" variant="outline">
                  Upload Property
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
