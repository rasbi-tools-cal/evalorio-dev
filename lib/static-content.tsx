/**
 * Static page content (English). Legal texts are a starting template and MUST be reviewed by a
 * lawyer and completed with the company's legal details (marked with [brackets]) before launch.
 */
import { Link } from "@/i18n/navigation"

export const STATIC_PAGES = ["about", "how-it-works", "contact", "terms", "privacy", "cookies"] as const
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
            <strong>Add up to 20 photos.</strong> The first photo is the cover. Location data inside photos is removed automatically.
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
  terms: {
    title: "Terms of use",
    description: "The rules for using Evalorio.",
    updated: "Draft — to be reviewed before launch",
    body: (
      <>
        <p>
          These terms govern the use of evalorio.com, operated by [Company legal name], [registered address], [registration number]
          (“Evalorio”, “we”).
        </p>
        <h2>1. The service</h2>
        <p>
          Evalorio lets private owners publish property listings for sale or rent and lets visitors search listings and contact
          owners. Evalorio is not a party to any transaction between users and does not act as a real estate agent.
        </p>
        <h2>2. Accounts</h2>
        <p>You must provide accurate information, keep your password secure and be at least 18 years old.</p>
        <h2>3. Listings</h2>
        <ul>
          <li>You may only publish properties you own or are authorised to market.</li>
          <li>Listings must be truthful: real photos, correct price, size and location.</li>
          <li>No duplicate listings, no contact details or links in text fields, no discriminatory or offensive content.</li>
          <li>We may review, reject, suspend or remove listings and accounts that break these rules.</li>
        </ul>
        <h2>4. Contact between users</h2>
        <p>
          Messages and phone numbers are shared only to discuss the listed property. Using them for spam or marketing is forbidden.
          Never send money before visiting a property and verifying the owner.
        </p>
        <h2>5. Liability</h2>
        <p>
          Listings are published by users. We moderate content but cannot guarantee its accuracy. To the extent permitted by law, we
          are not liable for agreements between users.
        </p>
        <h2>6. Changes and law</h2>
        <p>We may update these terms and will notify registered users of material changes. [Governing law and jurisdiction].</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    description: "How Evalorio collects and uses personal data.",
    updated: "Draft — to be reviewed before launch",
    body: (
      <>
        <p>Controller: [Company legal name], [address]. Contact: privacy@evalorio.com.</p>
        <h2>Data we process</h2>
        <ul>
          <li>Account: email, name, password (hashed), language, optional phone number.</li>
          <li>Listings: property details, photos (location metadata is removed on upload), exact address and position (private).</li>
          <li>Messages you send to owners: name, email, optional phone and message text.</li>
          <li>Security: salted hashes of IP addresses for rate limiting and abuse prevention; anti-bot checks by Cloudflare Turnstile.</li>
        </ul>
        <h2>Why and legal basis</h2>
        <ul>
          <li>Providing the service you signed up for (contract).</li>
          <li>Preventing fraud, spam and abuse (legitimate interest).</li>
          <li>Search alerts by email, only if you create them (consent; unsubscribe anytime).</li>
        </ul>
        <h2>Sharing</h2>
        <p>
          When you contact an owner, we share your name, email and optional phone with them. Processors: hosting and database
          [providers and regions], email delivery [provider], Cloudflare Turnstile. We do not sell personal data.
        </p>
        <h2>Retention</h2>
        <p>Account data is kept while your account exists. Deleted accounts are erased with their listings, photos and messages.</p>
        <h2>Your rights</h2>
        <p>
          Access, rectification, erasure, portability, objection and complaint to your data protection authority. Download or delete
          your data from Account → Settings, or write to privacy@evalorio.com.
        </p>
      </>
    ),
  },
  cookies: {
    title: "Cookie policy",
    description: "Which cookies Evalorio uses.",
    body: (
      <>
        <p>Evalorio only uses cookies that are strictly necessary for the site to work. We do not use advertising or tracking cookies.</p>
        <ul>
          <li>
            <strong>Authentication (sb-*)</strong>: keeps you logged in. Set by our authentication provider, deleted when you log out.
          </li>
          <li>
            <strong>Cloudflare Turnstile</strong>: may process technical signals to tell humans from bots on forms (login, sign-up,
            contact).
          </li>
        </ul>
        <p>Because these are strictly necessary, no consent banner is required. If we ever add optional cookies, we will ask first.</p>
      </>
    ),
  },
}
