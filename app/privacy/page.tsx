import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { Card } from "@/components/ui/card"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - Evalorio",
  description: "Learn how Evalorio collects, uses, and protects your personal data in compliance with GDPR.",
  alternates: {
    canonical: "/privacy",
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteNav />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              Evalorio ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you use our AI-powered property analysis
              platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email address (for account creation and authentication)</li>
                  <li>Display name (optional, if you choose to set one)</li>
                  <li>Payment information (processed securely through our payment provider)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Usage Data</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Videos and images you upload for property analysis</li>
                  <li>Property location data (country and city you select)</li>
                  <li>Analysis results and generated content</li>
                  <li>Credit usage and transaction history</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>To provide and maintain our property analysis service</li>
              <li>To process your uploads and generate AI-powered insights</li>
              <li>To manage your account and credits</li>
              <li>To send you service-related notifications</li>
              <li>To improve our services through analytics</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Cookies and Tracking</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Essential Cookies</h3>
                <p>Required for authentication and basic functionality. These cannot be disabled.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Analytics Cookies</h3>
                <p>Help us understand how you use our platform. You can opt-out through the cookie banner.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your data, including encryption in transit and
              at rest, secure authentication, and regular security audits. However, no method of transmission over the
              Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights (GDPR)</h2>
            <p className="text-muted-foreground mb-4">Under GDPR, you have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                <strong>Right to Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Right to Rectification:</strong> Correct inaccurate data through your dashboard
              </li>
              <li>
                <strong>Right to Erasure:</strong> Delete your account and all associated data
              </li>
              <li>
                <strong>Right to Data Portability:</strong> Export your data in a machine-readable format
              </li>
              <li>
                <strong>Right to Object:</strong> Object to processing of your data
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Withdraw consent at any time
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active. If you delete your account, we will permanently
              delete all your personal data within 30 days, except where we are legally required to retain certain
              information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Third-Party Services</h2>
            <p className="text-muted-foreground mb-2">We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Supabase (database and authentication)</li>
              <li>Vercel (hosting and edge functions)</li>
              <li>Payment processors (for credit purchases)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for users under 18 years of age. We do not knowingly collect personal
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              For any privacy-related questions, to exercise your rights, or to delete your account, please contact us
              at:{" "}
              <a href="mailto:hello@evalorio.com" className="text-primary hover:underline">
                hello@evalorio.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>
        </Card>
      </main>

      <SiteFooter />
    </div>
  )
}
