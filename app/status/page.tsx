"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"

type JobStatus = "processing" | "analyzing" | "generating" | "completed" | "failed"

interface StatusStep {
  id: JobStatus
  label: string
  description: string
}

const statusSteps: StatusStep[] = [
  { id: "processing", label: "Processing", description: "Uploading and preparing your media..." },
  { id: "analyzing", label: "Analyzing Content", description: "Detecting rooms and analyzing quality..." },
  { id: "generating", label: "Generating Content", description: "Creating marketing content..." },
  { id: "completed", label: "Finalizing", description: "Preparing your results..." },
]

function StatusContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoId = searchParams.get("id")
  const [currentStatus, setCurrentStatus] = useState<JobStatus>("processing")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [processingTriggered, setProcessingTriggered] = useState(false)

  useEffect(() => {
    if (!videoId) {
      router.push("/upload")
      return
    }

    const supabase = createClient()
    let isMounted = true

    const triggerProcessing = async () => {
      if (processingTriggered) return
      setProcessingTriggered(true)

      try {
        console.log("[v0] Triggering video processing for:", videoId)
        await fetch("/api/process-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        })
        console.log("[v0] Processing triggered successfully")
      } catch (err) {
        console.error("[v0] Failed to trigger processing:", err)
      }
    }

    triggerProcessing()

    const pollStatus = async () => {
      try {
        const { data, error } = await supabase.from("videos").select("status").eq("id", videoId).single()

        if (!isMounted) return

        if (error) {
          console.error("[v0] Error fetching video status:", error)
          setError("Failed to fetch video status")
          return
        }

        if (data) {
          console.log("[v0] Current video status:", data.status)
          setCurrentStatus(data.status as JobStatus)

          const statusIndex = statusSteps.findIndex((step) => step.id === data.status)
          const newProgress = statusIndex >= 0 ? ((statusIndex + 1) / statusSteps.length) * 100 : 25
          setProgress(newProgress)

          if (data.status === "completed") {
            console.log("[v0] Status completed, redirecting to results...")
            setTimeout(() => {
              router.push(`/results?id=${videoId}`)
            }, 1000)
          } else if (data.status === "failed") {
            setError("Analysis failed. Please try again.")
          }
        }
      } catch (err) {
        console.error("[v0] Unexpected error:", err)
        if (isMounted) {
          setError("An unexpected error occurred")
        }
      }
    }

    pollStatus()
    const interval = setInterval(pollStatus, 1500)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [videoId, router, processingTriggered])

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex((step) => step.id === currentStatus)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteNav />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Error</h2>
            <p className="text-lg text-muted-foreground text-pretty">{error}</p>
            <Link href="/upload">
              <Button>Try Again</Button>
            </Link>
          </Card>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteNav />
      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">Analyzing Your Property</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Our AI is hard at work processing your media. This usually takes 1-2 minutes.
          </p>
        </div>

        <Card className="p-8 lg:p-12">
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium text-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isActive = step.id === currentStatus
              const isComplete = index < getCurrentStepIndex()

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                    isActive ? "bg-primary/5 border-2 border-primary/20" : isComplete ? "bg-muted/50" : "bg-muted/20"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isComplete
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold mb-1 ${
                        isActive || isComplete ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              You'll be automatically redirected when the analysis is complete. Feel free to stay on this page or come
              back later.
            </p>
          </div>
        </Card>
      </div>
      <SiteFooter />
    </div>
  )
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  )
}
