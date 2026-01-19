"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== "delete my account") {
      setError('Please type "DELETE MY ACCOUNT" to confirm')
      return
    }

    setIsDeleting(true)
    setError("")

    try {
      const response = await fetch("/api/delete-account", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete account")
      }

      router.push("/auth/login?deleted=true")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p className="font-semibold">This action cannot be undone.</p>
            <p>Deleting your account will permanently remove:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Your profile and account information</li>
              <li>All uploaded videos and images</li>
              <li>All property analysis results</li>
              <li>Remaining credits</li>
              <li>All associated data</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              According to GDPR, this will permanently delete all your personal data from our servers within 30 days.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <span className="font-bold">DELETE MY ACCOUNT</span> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              disabled={isDeleting}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || !confirmText}>
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
