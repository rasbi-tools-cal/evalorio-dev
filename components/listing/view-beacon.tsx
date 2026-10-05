"use client"

import { useEffect } from "react"
import { recordListingView } from "@/lib/actions/views"

/** Records one view per page load, after the listing is on screen. Renders nothing. */
export function ListingViewBeacon({ listingId }: { listingId: number }) {
  useEffect(() => {
    void recordListingView(listingId)
  }, [listingId])
  return null
}
