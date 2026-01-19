"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AddCreditsFormProps {
  userId: string
  userEmail: string
  currentCredits: number
}

export function AddCreditsForm({ userId, userEmail, currentCredits }: AddCreditsFormProps) {
  const [credits, setCredits] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const creditAmount = Number.parseInt(credits)
    if (isNaN(creditAmount) || creditAmount <= 0) {
      toast.error("Please enter a valid number of credits")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/add-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          credits: creditAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add credits")
      }

      toast.success(`Added ${creditAmount} credits to ${userEmail}. New balance: ${data.newCredits}`)
      setCredits("")
      router.refresh()
    } catch (error) {
      console.error("Error adding credits:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add credits")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type="number"
        placeholder="Add credits"
        value={credits}
        onChange={(e) => setCredits(e.target.value)}
        min="1"
        className="h-8 text-sm"
        disabled={isLoading}
      />
      <Button type="submit" size="sm" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </>
        )}
      </Button>
    </form>
  )
}
