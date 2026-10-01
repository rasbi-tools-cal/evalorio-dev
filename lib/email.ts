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

/** Minimal branded layout. `bodyHtml` must already be escaped. */
export function emailLayout(bodyHtml: string, footerHtml = "") {
  return `<!doctype html><html><body style="margin:0;background:#f8f9ff;font-family:Inter,Arial,sans-serif;color:#0b1c30">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #d9e2dc;border-radius:12px;padding:28px">
<tr><td style="font-size:22px;font-weight:700;padding-bottom:16px"><a href="${SITE_URL}" style="color:#0b1c30;text-decoration:none">Evalorio</a></td></tr>
<tr><td style="font-size:15px;line-height:24px">${bodyHtml}</td></tr>
${footerHtml ? `<tr><td style="padding-top:24px;font-size:12px;line-height:18px;color:#565e74">${footerHtml}</td></tr>` : ""}
</table></td></tr></table></body></html>`
}

export function emailButton(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#006948;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${escapeHtml(label)}</a>`
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
