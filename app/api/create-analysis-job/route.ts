import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { filename, fileUrl } = await request.json()

    if (!filename || !fileUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user's current credits
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (userData.credits < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
    }

    // Deduct 1 credit
    const { error: updateError } = await supabase
      .from("users")
      .update({ credits: userData.credits - 1 })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update credits" }, { status: 500 })
    }

    // Create video job record
    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        filename,
        file_url: fileUrl,
        status: "pending",
      })
      .select()
      .single()

    if (videoError) {
      // Rollback credits
      await supabase.from("users").update({ credits: userData.credits }).eq("id", user.id)
      return NextResponse.json({ error: "Failed to create job" }, { status: 500 })
    }

    // TODO: Trigger actual video analysis here
    // For now, we'll simulate processing with a mock function
    simulateVideoProcessing(videoData.id)

    return NextResponse.json({
      success: true,
      jobId: videoData.id,
      creditsRemaining: userData.credits - 1,
    })
  } catch (error) {
    console.error("[v0] Error creating analysis job:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Mock function to simulate video processing
// TODO: Replace with actual video analysis service
async function simulateVideoProcessing(videoId: string) {
  // This simulates background processing
  // In production, this would be handled by a separate service/worker
  setTimeout(async () => {
    const supabase = await createClient()

    // Update video status to processing
    await supabase.from("videos").update({ status: "processing" }).eq("id", videoId)

    // Simulate analysis after 10 seconds
    setTimeout(async () => {
      await supabase.from("videos").update({ status: "analyzing" }).eq("id", videoId)

      // Simulate completion after 15 seconds
      setTimeout(async () => {
        // Create mock analysis results
        await supabase.from("analysis_results").insert({
          video_id: videoId,
          property_score: Math.floor(Math.random() * 30) + 70, // 70-100
          detected_rooms: ["Living Room", "Kitchen", "Bedroom", "Bathroom"],
          estimated_surface: Math.floor(Math.random() * 50) + 80, // 80-130 m²
          finishes_quality: ["Modern kitchen", "Hardwood floors", "LED lighting", "Built-in wardrobes"],
          ai_description:
            "Beautiful modern apartment with excellent natural lighting and contemporary finishes. The open-plan living area creates a spacious feel, perfect for entertaining.",
          ai_titles: "Stunning Modern Apartment | Must-See Property | Dream Home Alert",
          ai_hashtags: "#realestate #modernhome #apartmentliving #propertyforsale #dreamhome #luxuryliving",
          tiktok_video_url: null, // TODO: Generate actual TikTok video
        })

        await supabase.from("videos").update({ status: "completed" }).eq("id", videoId)
      }, 15000)
    }, 10000)
  }, 5000)
}
