import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import UploadClient from "./upload-client"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Upload Property Video or Images - Evalorio",
  description:
    "Upload your property videos or images for instant AI analysis. Get room detection, quality scoring, and marketing content in minutes.",
  alternates: {
    canonical: "/upload",
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default async function UploadPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("credits").eq("id", user.id).single()

  const credits = userData?.credits || 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteNav />
      <div className="flex-1">
        <UploadClient userEmail={user.email || ""} credits={credits} userId={user.id} />
      </div>
      <SiteFooter />
    </div>
  )
}
