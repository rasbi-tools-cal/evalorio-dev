"use server"

import { z } from "zod"
import { CATEGORIES, CATEGORY_TYPES, COUNTRY_CODES, OPERATIONS } from "@/lib/catalog"
import { parseFilters, toRpcArgs } from "@/lib/search/filters"
import { createPublicClient } from "@/lib/supabase/public"

const scopeSchema = z.object({
  operation: z.enum(OPERATIONS),
  category: z.enum(CATEGORIES),
  country: z.enum(COUNTRY_CODES),
  provinceId: z.number().int().positive().optional(),
  cityId: z.number().int().positive().optional(),
  neighborhoodId: z.number().int().positive().optional(),
})

export type CountScope = z.infer<typeof scopeSchema>

/** Live "Show X results" count for the mobile filters drawer (public data, same filters as the page). */
export async function countResults(scope: CountScope, query: string): Promise<number | null> {
  const parsed = scopeSchema.safeParse(scope)
  if (!parsed.success || query.length > 2000) return null
  const filters = parseFilters(Object.fromEntries(new URLSearchParams(query)))
  const args = toRpcArgs(filters, { ...parsed.data, types: CATEGORY_TYPES[parsed.data.category] })
  const { data, error } = await createPublicClient().rpc("search_listings", { ...args, p_limit: 1 })
  if (error) return null
  return (data as unknown as { total: number }).total
}
