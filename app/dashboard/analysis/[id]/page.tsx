import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"

import ResultsPageContent from "./results-content"

export default async function DashboardAnalysisPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: video } = await supabase.from("videos").select("*").eq("id", params.id).single()

  if (!video || video.user_id !== user.id) {
    notFound()
  }

  return <ResultsPageContent video={video} />
}
