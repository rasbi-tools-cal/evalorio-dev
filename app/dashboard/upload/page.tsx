import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import UploadClient from "@/app/upload/upload-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Upload - Evalorio Dashboard",
  description: "Upload property videos or images for AI analysis",
  robots: { index: false, follow: true },
}

export default async function DashboardUploadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: userData } = await supabase.from("users").select("credits").eq("id", user.id).single()

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Upload Property Media</h1>
        <p className="text-muted-foreground">Upload videos or photos for instant AI analysis</p>
      </div>
      <UploadClient userEmail={user.email || ""} credits={userData?.credits || 0} userId={user.id} />
    </div>
  )
}
