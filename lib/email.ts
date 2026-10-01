import "server-only"
import nodemailer, { type Transporter } from "nodemailer"
import { SITE_URL } from "@/lib/env"

let transporter: Transporter | null = null

function getTransporter() {
  if (!process.env.SMTP_HOST) return null
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  })
  return transporter
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

/**
 * Branded layout shared by every email (same look as supabase/templates/*.html).
 * Table-based with inline styles so it renders in Gmail, Outlook and Apple Mail. `bodyHtml` must be escaped.
 */
export function emailLayout(bodyHtml: string, footerHtml = "") {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f3f6f4;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;color:#0b1c30;-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f4;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e1e8e3;border-radius:16px;overflow:hidden">
<tr><td style="height:4px;background:#006948;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 4px"><a href="${SITE_URL}" style="text-decoration:none"><img src="${SITE_URL}/email/evalorio-logo.png" width="120" height="22" alt="Evalorio" style="display:block;border:0;width:120px;height:auto"></a></td></tr>
<tr><td style="padding:20px 32px 32px;font-size:15px;line-height:24px;color:#3d4a42">${bodyHtml}</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="padding:20px 32px 0;font-size:12px;line-height:18px;color:#7a8580;text-align:center">
${footerHtml ? `${footerHtml}<br><br>` : ""}Evalorio · Homes from their owners in Spain, France, Italy and Portugal<br><a href="${SITE_URL}" style="color:#7a8580">evalorio.com</a>
</td></tr></table>
</td></tr></table></body></html>`
}

export function emailButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0"><tr><td style="border-radius:10px;background:#006948"><a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 22px;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:10px">${escapeHtml(label)}</a></td></tr></table>`
}

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  headers?: Record<string, string>
}) {
  const t = getTransporter()
  if (!t) {
    console.warn(`[email] SMTP not configured, skipped "${opts.subject}" to ${opts.to}`)
    return false
  }
  try {
    await t.sendMail({ from: process.env.EMAIL_FROM || "Evalorio <no-reply@evalorio.com>", ...opts })
    return true
  } catch (error) {
    console.error("[email] send failed", error)
    return false
  }
}
