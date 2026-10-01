/**
 * Static page content (English). Legal pages live in content/legal/<locale>/*.md.
 */
import { Link } from "@/i18n/navigation"

export const STATIC_PAGES = ["about", "how-it-works", "contact"] as const
export type StaticSlug = (typeof STATIC_PAGES)[number]

export const STATIC_CONTENT: Record<StaticSlug, { title: string; description: string; updated?: string; body: React.ReactNode }> = {
  about: {
    title: "About Evalorio",
    description: "Evalorio is a property portal for Spain, France, Italy and Portugal where owners list for free and talk directly to buyers and tenants.",
    body: (
      <>
        <p>
          Evalorio is a property portal for Spain, France, Italy and Portugal. Owners publish their homes for free, and buyers and
          tenants contact them directly — by message or phone — without intermediaries.
        </p>
        <h2>What we believe</h2>
        <ul>
          <li>Listing a property should be free and take minutes, not hours.</li>
          <li>People searching deserve accurate listings, real photos and direct contact.</li>
          <li>Personal data stays private: exact addresses and phone numbers are only shared when the owner chooses.</li>
        </ul>
        <h2>How we keep listings trustworthy</h2>
        <p>
          New owners’ first listings are reviewed by our team before they go live. Everyone can report a listing, and we remove
          scams and misleading content quickly.
        </p>
      </>
    ),
  },
  "how-it-works": {
    title: "How listing works",
    description: "Publish your property for free on Evalorio in five simple steps and get contacted directly by buyers and tenants.",
    body: (
      <>
        <ol>
          <li>
            <strong>Create a free account</strong> and confirm your email address.
          </li>
          <li>
            <strong>Describe your property</strong>: type, location on the map, size, rooms and price. You can save and finish later.
          </li>
          <li>
            <strong>Add up to 12 photos.</strong> The first photo is the cover. Location data inside photos is removed automatically.
          </li>
          <li>
            <strong>Publish.</strong> Your first listing is reviewed by our team, usually within a few hours. After that, your listings
            go live instantly.
          </li>
          <li>
            <strong>Get contacted.</strong> Messages arrive in your account and by email; your phone number is only shown to people who
            click “Show phone number”.
          </li>
        </ol>
        <h2>Good to know</h2>
        <ul>
          <li>Listings stay online for 90 days and can be renewed with one click.</li>
          <li>You can pause a listing or mark it as sold/rented at any time.</li>
          <li>Please don’t include phone numbers, emails or links in the title or description — people contact you through Evalorio.</li>
        </ul>
        <p>
          <Link href="/post">List your property now →</Link>
        </p>
      </>
    ),
  },
  contact: {
    title: "Contact",
    description: "How to contact the Evalorio team.",
    body: (
      <>
        <p>
          For questions about your account or a listing, write to <a href="mailto:support@evalorio.com">support@evalorio.com</a>.
        </p>
        <p>
          To report a suspicious listing, use the “Report this listing” link on the listing page — reports reach our moderation team
          directly.
        </p>
        <p>
          For privacy requests (access, correction, deletion), write to <a href="mailto:privacy@evalorio.com">privacy@evalorio.com</a>.
          You can also download or delete your data yourself from your account settings.
        </p>
      </>
    ),
  },
}
