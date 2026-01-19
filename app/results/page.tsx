"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Download,
  Copy,
  Home,
  Bed,
  Bath,
  Square,
  Star,
  TrendingUp,
  Loader2,
  AlertCircle,
  Video,
  Lightbulb,
  LayoutGrid,
  DollarSign,
  ExternalLink,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SiteNav } from "@/components/site-nav"
import { SiteFooter } from "@/components/site-footer"
import { generateMockListings, type MockListing } from "@/lib/real-estate-sites"

interface AnalysisResults {
  score: number
  rooms: Array<{ name: string; confidence: number }>
  estimatedArea: number
  finishes: string
  description: string
  titles: string[]
  hashtags: string[]
  videoUrl: string | null
  imageUrls?: string[]
  uploadType: string
  propertyType?: string
  address?: string
  videoDuration?: number
  photoCount?: number
  lightingScore?: number
  layoutFlowScore?: number
  tiktokVideoUrl?: string
  estimatedPrice?: number
  priceCurrency?: string
  country?: string
  city?: string
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get("id")
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [similarListings, setSimilarListings] = useState<MockListing[]>([])

  useEffect(() => {
    if (!videoId) {
      setError("No video ID provided")
      setLoading(false)
      return
    }

    const fetchResults = async () => {
      const supabase = createClient()

      try {
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .select("file_url, upload_type, image_urls, country, city")
          .eq("id", videoId)
          .single()

        if (videoError) {
          console.error("[v0] Error fetching video:", videoError)
          setError("Failed to fetch video data")
          return
        }

        const { data: analysisData, error: analysisError } = await supabase
          .from("analysis_results")
          .select("*")
          .eq("video_id", videoId)
          .single()

        if (analysisError) {
          console.error("[v0] Error fetching analysis:", analysisError)
          setError("Analysis results not found")
          return
        }

        const resultsData = {
          score: analysisData.property_score || 0,
          rooms: analysisData.detected_rooms || [],
          estimatedArea: analysisData.estimated_surface || 0,
          finishes: analysisData.finishes_quality || "N/A",
          description: analysisData.ai_description || "",
          titles: analysisData.ai_titles || [],
          hashtags: analysisData.ai_hashtags || [],
          videoUrl: videoData.file_url,
          imageUrls: videoData.image_urls || [],
          uploadType: videoData.upload_type || "video",
          propertyType: analysisData.property_type || "Apartment",
          address: analysisData.address,
          videoDuration: analysisData.video_duration,
          photoCount: analysisData.photo_count || videoData.image_urls?.length || 0,
          lightingScore: analysisData.lighting_score || 0,
          layoutFlowScore: analysisData.layout_flow_score || 0,
          tiktokVideoUrl: analysisData.tiktok_video_url,
          estimatedPrice: analysisData.estimated_price,
          priceCurrency: analysisData.price_currency || "EUR",
          country: videoData.country || "United States",
          city: videoData.city || "New York",
        }

        setResults(resultsData)

        if (videoData.country && videoData.city) {
          const mockListings = generateMockListings(
            videoData.country,
            videoData.city,
            resultsData.propertyType || "Apartment",
            resultsData.estimatedArea,
            resultsData.rooms.length,
          )
          setSimilarListings(mockListings)
        }
      } catch (err) {
        console.error("[v0] Unexpected error:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [videoId])

  const handleCopyText = () => {
    if (!results) return
    const textToCopy = `${results.titles[0] || "Property Title"}\n\n${results.description}\n\n${results.hashtags.join(" ")}`
    navigator.clipboard.writeText(textToCopy)
  }

  const handleDownloadVideo = async () => {
    if (!videoId) return

    setDownloading(true)
    try {
      const response = await fetch(`/api/download-video?videoId=${videoId}`)

      if (!response.ok) {
        throw new Error("Failed to download video")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `evalorio-property-video-${videoId}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Error downloading video:", error)
      alert("Failed to download video. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Very Good"
    if (score >= 70) return "Good"
    if (score >= 60) return "Fair"
    return "Needs Improvement"
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteNav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteNav />
        <div className="flex-1 max-w-3xl mx-auto px-4 py-16">
          <nav className="border-b border-border bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="flex items-center">
                  <Image
                    src="/evalorio-logo.svg"
                    alt="Evalorio"
                    width={136}
                    height={28}
                    className="h-7 w-auto"
                    priority
                  />
                </Link>
              </div>
            </div>
          </nav>
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error || "Results not found"}</AlertDescription>
          </Alert>
          <Link href="/upload" className="mt-4 inline-block">
            <Button>Upload New Video</Button>
          </Link>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteNav />
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            <span>Analysis Complete</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Your Property Analysis <span className="text-primary">Results</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            AI-powered insights and marketing content ready to use
          </p>
        </div>

        <div className="mb-16 p-8 sm:p-12 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl border border-primary/20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <p className="text-sm font-medium text-muted-foreground mb-3">Overall Property Score</p>
              <div className="flex items-baseline gap-4 justify-center lg:justify-start">
                <span className={`text-7xl sm:text-8xl font-bold ${getScoreColor(results.score)}`}>
                  {results.score}
                </span>
                <span className="text-3xl text-muted-foreground">/100</span>
              </div>
              <Badge variant="secondary" className="mt-4 text-base px-4 py-1">
                {getScoreLabel(results.score)}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {results.videoUrl && (
                <Button size="lg" className="gap-2 h-12 px-6" onClick={handleDownloadVideo} disabled={downloading}>
                  <Download className="w-5 h-5" />
                  {downloading ? "Downloading..." : "Download Video"}
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={handleCopyText} className="gap-2 h-12 px-6 bg-transparent">
                <Copy className="w-5 h-5" />
                Copy Content
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Property Overview</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Property Type</p>
              <p className="text-lg font-semibold text-foreground">{results.propertyType || "Apartment"}</p>
            </div>

            <div className="p-6 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Square className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Estimated Area</p>
              <p className="text-lg font-semibold text-foreground">{results.estimatedArea} sqm</p>
            </div>

            <div className="p-6 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Rooms Detected</p>
              <p className="text-lg font-semibold text-foreground">{results.rooms.length}</p>
            </div>

            <div className="p-6 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Finish Quality</p>
              <p className="text-lg font-semibold text-foreground">{results.finishes}</p>
            </div>
          </div>
        </div>

        {results.estimatedPrice && (
          <div className="mb-16 p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/10 dark:to-emerald-950/10 rounded-2xl border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-green-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Estimated Market Price</p>
                <p className="text-3xl sm:text-4xl font-bold text-foreground">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: results.priceCurrency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(results.estimatedPrice)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on {results.city}, {results.country} market data and property features
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Detected Rooms</h2>
          <p className="text-muted-foreground mb-8">AI-powered room recognition with confidence scores</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {results.rooms.map((room, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-5 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    {room.name.toLowerCase().includes("bedroom") ? (
                      <Bed className="w-5 h-5 text-primary" />
                    ) : room.name.toLowerCase().includes("bathroom") ? (
                      <Bath className="w-5 h-5 text-primary" />
                    ) : (
                      <Home className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <p className="font-semibold text-foreground">{room.name}</p>
                </div>
                <Badge variant="outline" className="font-medium">
                  {Math.round(room.confidence * 100)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {((results.lightingScore !== undefined && results.lightingScore > 0) ||
          (results.layoutFlowScore !== undefined && results.layoutFlowScore > 0)) && (
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Quality Scores</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {results.lightingScore !== undefined && results.lightingScore > 0 && (
                <div className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/10 dark:to-amber-950/10 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-yellow-600/10 rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lighting Quality</p>
                      <p className="text-2xl font-bold text-foreground">{results.lightingScore}/100</p>
                    </div>
                  </div>
                  <div className="w-full bg-yellow-200/50 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full transition-all"
                      style={{ width: `${results.lightingScore}%` }}
                    />
                  </div>
                </div>
              )}

              {results.layoutFlowScore !== undefined && results.layoutFlowScore > 0 && (
                <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/10 dark:to-violet-950/10 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center">
                      <LayoutGrid className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Layout Flow</p>
                      <p className="text-2xl font-bold text-foreground">{results.layoutFlowScore}/100</p>
                    </div>
                  </div>
                  <div className="w-full bg-purple-200/50 rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full transition-all"
                      style={{ width: `${results.layoutFlowScore}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-16 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/10 dark:to-indigo-950/10 rounded-2xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">AI-Generated Marketing Content</h2>
          </div>

          <div className="space-y-6">
            {results.titles && results.titles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Title</p>
                <p className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed">{results.titles[0]}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-base text-foreground leading-relaxed">{results.description}</p>
            </div>

            {results.hashtags && results.hashtags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Hashtags</p>
                <p className="text-base text-primary font-medium">{results.hashtags.join(" ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Media Preview */}
        {results.uploadType === "images" && results.imageUrls && results.imageUrls.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Uploaded Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {results.imageUrls.map((url, index) => (
                <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={url || "/placeholder.svg"}
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TikTok Video Preview */}
        {results.tiktokVideoUrl && (
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
              <Video className="w-7 h-7 text-primary" />
              TikTok-Ready Video Preview
            </h2>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video controls className="w-full h-full" src={results.tiktokVideoUrl}>
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={handleDownloadVideo} disabled={downloading} className="gap-2">
                <Download className="w-4 h-4" />
                {downloading ? "Downloading..." : "Download TikTok Video"}
              </Button>
            </div>
          </div>
        )}

        {/* Similar Listings */}
        {similarListings.length > 0 && (
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <TrendingUp className="w-7 h-7 text-primary" />
                Similar Properties in {results?.city}
              </h2>
              <p className="text-muted-foreground">View comparable listings from local real estate platforms</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarListings.map((listing) => (
                <a
                  key={listing.id}
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-6 bg-muted/30 rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 flex-1 text-base group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-2 flex-shrink-0" />
                  </div>
                  <p className="text-2xl font-bold text-primary mb-4">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: listing.currency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(listing.price)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5">
                      <Bed className="w-4 h-4" />
                      {listing.rooms} rooms
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Square className="w-4 h-4" />
                      {listing.surface} sqm
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {listing.sourceSite}
                    </Badge>
                    <span className="text-xs text-primary group-hover:underline">View listing →</span>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-medium text-foreground">Note:</span> Links direct to search results on{" "}
                {similarListings[0]?.sourceSite} and similar platforms for comparable properties in your area
              </p>
            </div>
          </div>
        )}

        <div className="p-8 sm:p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 rounded-2xl border border-primary/20 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Ready to analyze another property?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Upload new media and get instant AI-powered property analysis with market insights
          </p>
          <Link href="/upload">
            <Button size="lg" className="gap-2 h-12 px-8 text-base">
              <Sparkles className="w-5 h-5" />
              Analyze Another Property
            </Button>
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col">
          <SiteNav />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <SiteFooter />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
