"use server"

import { z } from "zod"
import { POLICY_VERSION } from "@/lib/legal/company"
import { clientIp, hashIp, rateLimit } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "@/lib/supabase/server"

const schema = z.object({
  consentId: z.string().uuid(),
  categories: z.object({ preferences: z.boolean(), analytics: z.boolean(), marketing: z.boolean() }),
  action: z.enum(["accept_all", "reject_all", "custom", "gpc"]),
})

/** Server-side proof of a cookie choice (who/when/what/which policy version), Art. 7(1) GDPR. */
export async function recordConsent(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const }
  const ip = hashIp(await clientIp())
  if (!(await rateLimit(`consent:${ip}`, 30, 3600))) return { ok: false as const }
  const user = await getUser()
  const { error } = await createAdminClient().from("consent_records").insert({
    consent_id: parsed.data.consentId,
    user_id: user?.id ?? null,
    policy_version: POLICY_VERSION,
    categories: parsed.data.categories,
    action: parsed.data.action,
    ip_hash: ip,
  })
  return { ok: !error }
}
