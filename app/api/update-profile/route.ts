import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { display_name } = await request.json()

    // Validate display name
    if (!display_name || typeof display_name !== "string") {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 })
    }

    if (display_name.trim().length < 2) {
      return NextResponse.json({ error: "Display name must be at least 2 characters" }, { status: 400 })
    }

    if (display_name.length > 50) {
      return NextResponse.json({ error: "Display name must be 50 characters or less" }, { status: 400 })
    }

    // Update user profile
    const { error } = await supabase.from("users").update({ display_name: display_name.trim() }).eq("id", user.id)

    if (error) {
      console.error("Error updating profile:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update-profile route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
