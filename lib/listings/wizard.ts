import type { CityOption } from "@/components/search/location-autocomplete"
import type { Operation, PropertyType } from "@/lib/catalog"

/** Shared between the server edit page and the client wizard (must not live in a "use client" file). */
export const STEPS = ["basics", "location", "details", "photos", "publish"] as const
export type Step = (typeof STEPS)[number]

export interface WizardListing {
  id: number
  ownerId: string
  status: string
  operation: Operation
  property_type: PropertyType
  title: string | null
  description: string | null
  price: number | null
  area_m2: number | null
  bedrooms: number | null
  bathrooms: number | null
  floor: number | null
  year_built: number | null
  energy_rating: string | null
  features: string[]
  rejection_reason: string | null
  city: CityOption | null
  neighborhoodId: number | null
  point: [number, number] | null
  address: string | null
  showExact: boolean
  contactName: string | null
  contactPhone: string | null
  showPhone: boolean
  photos: { id: string; storage_path: string }[]
}

