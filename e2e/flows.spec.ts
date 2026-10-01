import { expect, test, type Page } from "@playwright/test"
import path from "node:path"

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324"
const stamp = Date.now()
const owner = { name: "Test Owner", email: `owner.${stamp}@example.com`, password: "Evalorio2026x" }
const title = `E2E sunny flat ${stamp.toString(36)}`

async function latestEmailLink(to: string, contains: string) {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)
    const json = (await res.json()) as { messages: { ID: string }[] }
    if (json.messages?.length) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${json.messages[0].ID}`)).json()) as { HTML: string }
      const links = [...msg.HTML.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"))
      const link = links.find((l) => l.includes(contains))
      if (link) return link
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`no email for ${to}`)
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  const submit = page.getByRole("button", { name: "Log in" })
  await expect(submit).toBeEnabled() // waits for the Turnstile token
  await submit.click()
  await page.waitForURL(/\/account\/listings/)
}

test.describe.serial("owner → moderation → buyer", () => {
  test("sign up and confirm email", async ({ page }) => {
    await page.goto("/signup")
    await page.getByLabel("Your name").fill(owner.name)
    await page.getByLabel("Email").fill(owner.email)
    await page.getByLabel("Password", { exact: true }).fill(owner.password)
    const submit = page.getByRole("button", { name: "Create account" })
    await expect(submit).toBeEnabled()
    await submit.click()
    await expect(page.getByText("Check your email")).toBeVisible()

    const link = await latestEmailLink(owner.email, "/api/auth/confirm")
    await page.goto(link)
    await page.waitForURL(/\/account\/listings/)
    await expect(page.getByRole("heading", { name: "My listings" })).toBeVisible()
  })

  test("post a listing in five steps", async ({ page }) => {
    page.on("console", (m) => m.type() === "error" && console.log("browser error:", m.text().slice(0, 300)))
    page.on("pageerror", (e) => console.log("pageerror:", e.message))
    await login(page, owner.email, owner.password)
    await page.goto("/post")
    await page.getByText("Sell", { exact: true }).click()
    await page.getByText("Apartment", { exact: true }).click()
    await page.getByRole("button", { name: "Continue" }).click()

    await page.waitForURL(/step=location/)
    await page.getByLabel("City or town").fill("Valen")
    await page.getByRole("option", { name: /Valencia/ }).first().click()
    await expect(page.locator(".leaflet-container")).toBeVisible()
    await page.getByLabel(/Street and number/).fill("Calle de Prueba 1")
    await page.getByRole("button", { name: "Continue" }).click()

    await page.getByLabel("Price").fill("235000")
    await page.getByLabel("Size (m²)").fill("84")
    await page.getByLabel("Bedrooms").fill("3")
    await page.getByLabel("Bathrooms").fill("2")
    await page.getByText("Elevator", { exact: true }).click()
    await page.getByLabel(/^Title/).fill(title)
    await page.getByLabel(/^Description/).fill("Bright apartment close to the old town, fully renovated, lots of light.")
    await page.getByRole("button", { name: "Continue" }).click()

    await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "fixtures", "house.jpg"))
    await expect(page.getByText("Cover")).toBeVisible({ timeout: 30_000 })
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page).toHaveURL(/step=publish/)

    await page.getByRole("textbox", { name: /Phone number/ }).fill("+34 611 222 333")
    await page.getByRole("checkbox", { name: /I confirm I am the owner/ }).check()
    await page.getByRole("button", { name: "Publish listing" }).click()
    await expect(page.getByText("Thank you! Your listing was submitted.")).toBeVisible()
    await expect(page.getByText(/review it shortly/)).toBeVisible()
  })

  test("contact details are refused in the description (single-page editor)", async ({ page }) => {
    await login(page, owner.email, owner.password)
    await page.goto("/account/listings")
    await page.getByRole("link", { name: "Edit" }).first().click()
    await page.waitForURL(/\/account\/listings\/\d+\/edit/)
    await expect(page.getByRole("navigation", { name: "My account" })).toBeVisible() // dashboard sidebar
    await page.getByLabel(/^Description/).fill("Call me on +34 600 111 222 or write to me@example.com")
    await page.getByRole("button", { name: "Save changes" }).click()
    await expect(page.getByText("Please remove phone numbers, emails and links from the text")).toBeVisible()
  })

  test("admin approves, listing becomes public and searchable", async ({ page, browser }) => {
    const anon = await browser.newPage()
    await anon.goto("/spain/valencia/homes-for-sale")
    await expect(anon.getByText(title)).toHaveCount(0)

    await login(page, "admin@evalorio.test", "Evalorio2026")
    await page.goto("/admin")
    const card = page.locator("li", { hasText: title })
    await expect(card).toBeVisible()
    await card.getByRole("button", { name: "Approve" }).click()
    await expect(page.getByText(title)).toHaveCount(0)

    await anon.goto("/spain/valencia/homes-for-sale")
    await expect(anon.getByRole("link", { name: title })).toBeVisible()
    await anon.close()
  })

  test("buyer reveals phone and messages the owner", async ({ page }) => {
    await page.goto("/spain/valencia/homes-for-sale")
    await page.getByRole("link", { name: title }).click()
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible()
    expect(await page.content()).not.toContain("611 222 333")

    await page.getByRole("button", { name: "Show phone number" }).click()
    await expect(page.getByRole("link", { name: /611 222 333/ })).toBeVisible()

    await page.getByLabel("Your name").fill("Buyer Person")
    await page.getByLabel("Your email").fill(`buyer.${stamp}@example.com`)
    const send = page.getByRole("button", { name: "Send message" })
    await expect(send).toBeEnabled()
    await send.click()
    await expect(page.getByText("Message sent!")).toBeVisible()
  })

  test("owner receives the message by email and in the inbox", async ({ page }) => {
    const link = await latestEmailLink(owner.email, "/account/messages")
    expect(link).toContain("/account/messages")
    await login(page, owner.email, owner.password)
    await page.goto("/account/messages")
    await expect(page.getByText("Buyer Person")).toBeVisible()
  })

  test("favourites and saved searches", async ({ page }) => {
    await login(page, owner.email, owner.password)
    await page.goto("/spain/madrid/homes-for-sale")
    await page.getByRole("button", { name: "Save to favourites" }).first().click()
    await expect(page.getByText("Saved to favourites")).toBeVisible()
    await page.getByRole("button", { name: "Save search" }).first().click()
    await expect(page.getByText(/Search saved/)).toBeVisible()

    await page.goto("/account/favorites")
    await expect(page.locator("article")).toHaveCount(1)
    await page.goto("/account/searches")
    await expect(page.getByRole("link", { name: /Homes for sale in Madrid/ }).first()).toBeVisible()
  })
})

test("protected pages redirect to login and non-admins get 404 on /admin", async ({ page }) => {
  await page.goto("/account/listings")
  await expect(page).toHaveURL(/\/login\?next=/)
  await login(page, "new@evalorio.test", "Evalorio2026")
  const res = await page.goto("/admin")
  expect(res?.status()).toBe(404)
})
