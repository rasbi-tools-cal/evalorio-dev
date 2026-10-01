import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

/** Contact details or links inside listing text (phone numbers, emails, URLs). */
export function containsContactInfo(text: string) {
  // Phone numbers have 9+ digits; prices like "1.250.000" have 7 and must not match.
  const phoneLike = text.match(/\+?\d[\d\s().-]{7,}\d/g) ?? []
  const phone = phoneLike.some((candidate) => candidate.replace(/\D/g, "").length >= 9)
  const email = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i
  const url = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|es|fr|it|pt|net|org|eu|io)\b/i
  return phone || email.test(text) || url.test(text)
}
