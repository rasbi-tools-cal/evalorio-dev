import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Get video data
    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .select("file_url")
      .eq("id", videoId)
      .single()

    if (videoError || !videoData?.file_url) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Fetch the video from Supabase Storage
    const videoResponse = await fetch(videoData.file_url)

    if (!videoResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
    }

    const videoBlob = await videoResponse.blob()

    // Return the video as a download
    return new NextResponse(videoBlob, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="evalorio-property-${videoId}.mp4"`,
      },
    })
  } catch (error) {
    console.error("[v0] Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
