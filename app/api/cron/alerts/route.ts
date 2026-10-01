import { timingSafeEqual } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { runAlerts } from "@/lib/alerts"

export const maxDuration = 300

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get("authorization") ?? ""
  if (!secret) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(header)
  return expected.length === given.length && timingSafeEqual(new Uint8Array(expected), new Uint8Array(given))
}

/** Vercel Cron (see vercel.json) calls this with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const frequency = request.nextUrl.searchParams.get("frequency")
  if (frequency !== "instant" && frequency !== "daily" && frequency !== "weekly") {
    return NextResponse.json({ error: "frequency must be instant|daily|weekly" }, { status: 400 })
  }
  const result = await runAlerts(frequency)
  return NextResponse.json(result)
}
