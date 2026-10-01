import { NextResponse, type NextRequest } from "next/server"
import { unsubscribeAlert } from "@/lib/actions/alerts"

/** RFC 8058 one-click unsubscribe (List-Unsubscribe-Post). */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? ""
  const res = await unsubscribeAlert(token)
  return new NextResponse(null, { status: res.ok ? 200 : 404 })
}
