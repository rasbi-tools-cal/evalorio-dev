import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video, ImageIcon, CheckCircle2, XCircle, Loader2, Upload, Clock, TrendingUp, BarChart3 } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - Evalorio",
  description: "View your property analysis history and manage your account",
  robots: { index: false, follow: true },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single()
  const { data: userVideos } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const completedVideos = userVideos?.filter((v) => v.status === "completed").length || 0
  const processingVideos = userVideos?.filter((v) => v.status !== "completed" && v.status !== "failed").length || 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {userData?.display_name || "User"}</h1>
        <p className="text-muted-foreground">Here's what's happening with your properties</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Analyses</span>
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{userVideos?.length || 0}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-green-900 dark:text-green-100">Completed</span>
          </div>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100">{completedVideos}</div>
        </div>

        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Processing</span>
          </div>
          <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{processingVideos}</div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Recent Analyses</h2>
            <p className="text-sm text-muted-foreground mt-1">Your latest property uploads and their status</p>
          </div>
          <Link href="/dashboard/upload">
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              New Upload
            </Button>
          </Link>
        </div>

        {!userVideos || userVideos.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-2xl mb-4">
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No analyses yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Upload your first property video or images to get instant AI-powered analysis and insights
            </p>
            <Link href="/dashboard/upload">
              <Button size="lg" className="gap-2">
                <Upload className="w-5 h-5" />
                Upload Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {userVideos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                    {video.upload_type === "images" ? (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Video className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{video.filename}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(video.created_at).toLocaleDateString()}
                      </div>
                      {video.country && (
                        <Badge variant="outline" className="text-xs">
                          {video.country}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(video.status)}
                    <span className="text-sm font-medium capitalize">{video.status}</span>
                  </div>
                  {video.status === "completed" ? (
                    <Link href={`/dashboard/analysis/${video.id}`}>
                      <Button size="sm">View Results</Button>
                    </Link>
                  ) : video.status === "failed" ? (
                    <Button size="sm" variant="outline" disabled>
                      Failed
                    </Button>
                  ) : (
                    <Link href={`/status?id=${video.id}`}>
                      <Button size="sm" variant="outline">
                        View Status
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
