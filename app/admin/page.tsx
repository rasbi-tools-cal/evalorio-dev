import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Video, CreditCard, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { AddCreditsForm } from "./add-credits-form"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Check if user is authenticated and is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  if (!userData?.is_admin) {
    redirect("/")
  }

  // Fetch admin statistics
  const { data: allUsers } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  const { data: allVideos } = await supabase.from("videos").select("*").order("created_at", { ascending: false })

  const totalUsers = allUsers?.length || 0
  const totalVideos = allVideos?.length || 0
  const totalCredits = allUsers?.reduce((sum, u) => sum + (u.credits || 0), 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Back to site
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Overview</h2>
          <p className="text-muted-foreground mt-2">Manage all users and their uploads</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVideos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCredits}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers?.map((user) => (
                  <div key={user.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{user.email}</p>
                          {user.is_admin && <Badge variant="secondary">Admin</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm">
                        <Badge variant="outline">
                          {user.credits} {user.credits === 1 ? "credit" : "credits"}
                        </Badge>
                      </div>
                    </div>
                    <AddCreditsForm userId={user.id} userEmail={user.email} currentCredits={user.credits || 0} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Videos</CardTitle>
              <CardDescription>Latest video uploads from all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allVideos?.slice(0, 10).map((video) => {
                  const userEmail = allUsers?.find((u) => u.id === video.user_id)?.email
                  return (
                    <div key={video.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{video.filename}</p>
                        <p className="text-xs text-muted-foreground">{userEmail}</p>
                      </div>
                      <Badge
                        variant={
                          video.status === "completed"
                            ? "default"
                            : video.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {video.status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
