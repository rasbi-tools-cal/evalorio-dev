import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { FileVideo, Calendar, MapPin, TrendingUp } from "lucide-react"

export default async function AnalysesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all analyses for this user
  const { data: videos, error } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching analyses:", error)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "processing":
      case "analyzing":
      case "generating":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Analyses</h1>
        <p className="text-muted-foreground">View all your property analyses and reports</p>
      </div>

      {!videos || videos.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl">
          <FileVideo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No analyses yet</h3>
          <p className="text-muted-foreground mb-6">Upload your first property video or image to get started</p>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Upload Property
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={video.status === "completed" ? `/dashboard/analysis/${video.id}` : `/status?id=${video.id}`}
              className="block group"
            >
              <div className="p-6 border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all bg-background">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {video.video_url ? (
                      <video src={video.video_url} className="w-full h-full object-cover" />
                    ) : (
                      <FileVideo className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                          {video.filename || "Property Analysis"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(video.created_at)}
                          </span>
                          {video.country && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {video.city}, {video.country}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`px-3 py-1 rounded-full border text-xs font-medium capitalize ${getStatusColor(video.status)}`}
                      >
                        {video.status}
                      </div>
                    </div>

                    {/* Analysis Details */}
                    {video.status === "completed" && (
                      <div className="flex items-center gap-6 text-sm">
                        {video.property_type && (
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">{video.property_type}</span>
                          </span>
                        )}
                        {video.surface && (
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">{video.surface}m²</span>
                          </span>
                        )}
                        {video.rooms && (
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">{video.rooms} rooms</span>
                          </span>
                        )}
                        {video.estimated_price && (
                          <span className="flex items-center gap-1 text-primary font-semibold">
                            <TrendingUp className="w-4 h-4" />€{video.estimated_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
