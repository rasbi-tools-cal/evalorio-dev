"use client"

import type React from "react"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteAccountDialog } from "@/components/delete-account-dialog"
import { useRouter } from "next/navigation"
import { UserIcon, Mail, Shield } from "lucide-react"

interface ProfileContentProps {
  user: User
  displayName: string | null
}

export function ProfileContent({ user, displayName: initialDisplayName }: ProfileContentProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName || "")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      })

      if (response.ok) {
        setMessage("Profile updated successfully!")
        router.refresh()
      } else {
        const error = await response.json()
        setMessage(error.error || "Failed to update profile")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                minLength={2}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This is how your name will appear throughout the dashboard
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">Your email address cannot be changed</p>
            </div>

            {message && (
              <div
                className={`text-sm px-4 py-2 rounded-lg ${message.includes("success") ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}
              >
                {message}
              </div>
            )}

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>Manage your data and account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium text-sm text-foreground">Your Rights</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Access your personal data</li>
              <li>• Export your analysis data</li>
              <li>• Request data deletion</li>
              <li>• Withdraw consent at any time</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="font-medium text-sm text-foreground mb-2">Delete Account</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <DeleteAccountDialog />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
