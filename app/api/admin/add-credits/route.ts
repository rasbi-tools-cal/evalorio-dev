import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { userId, credits } = await request.json()

    if (!userId || typeof credits !== "number") {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Get current credits for the user
    const { data: targetUser, error: fetchError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update credits
    const newCredits = (targetUser.credits || 0) + credits

    const { error: updateError } = await supabase
      .from("users")
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, newCredits })
  } catch (error) {
    console.error("Error adding credits:", error)
    return NextResponse.json({ error: "Failed to add credits" }, { status: 500 })
  }
}
