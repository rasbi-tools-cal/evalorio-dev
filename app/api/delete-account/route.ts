import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE() {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete user's videos (this will cascade delete analysis_results)
    const { error: videosError } = await supabase.from("videos").delete().eq("user_id", user.id)

    if (videosError) {
      console.error("Error deleting videos:", videosError)
      return NextResponse.json({ error: "Failed to delete user data" }, { status: 500 })
    }

    // Delete user profile
    const { error: userError } = await supabase.from("users").delete().eq("id", user.id)

    if (userError) {
      console.error("Error deleting user:", userError)
      return NextResponse.json({ error: "Failed to delete user profile" }, { status: 500 })
    }

    // Delete auth user (this will cascade to all related data due to foreign keys)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError)
      // Even if auth deletion fails, the data is already deleted
      // Sign out the user
      await supabase.auth.signOut()
      return NextResponse.json({ success: true })
    }

    // Sign out after successful deletion
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
