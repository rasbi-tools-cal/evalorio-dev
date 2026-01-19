"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Star,
  Home,
  MapPin,
  Ruler,
  Bed,
  Calendar,
  DollarSign,
  Download,
  Share2,
  Sparkles,
  CheckCircle2,
  Building2,
} from "lucide-react"
import { RealEstateSites } from "@/lib/real-estate-sites"

interface Video {
  id: string
  filename: string
  status: string
  ai_score?: number
  room_count?: number
  estimated_price_min?: number
  estimated_price_max?: number
  description?: string
  title?: string
  hashtags?: string
  country?: string
  city?: string
  address?: string
  property_type?: string
  surface?: number
  rooms?: number
  building_year?: number
  created_at: string
}

export default function ResultsPageContent({ video }: { video: Video }) {
  const score = video.ai_score || 0
  const similarListings = video.country ? RealEstateSites[video.country]?.slice(0, 3) || [] : []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analysis Results</h1>
            <p className="text-muted-foreground">AI-powered property evaluation</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </Badge>
          {video.country && (
            <Badge variant="outline" className="gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {video.country}
            </Badge>
          )}
        </div>
      </div>

      {/* AI Score */}
      <div className="mb-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Evalorio AI Score</h2>
            <p className="text-sm text-muted-foreground">Overall property quality rating</p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${i < Math.floor(score / 20) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
              />
            ))}
          </div>
        </div>
        <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {score}/100
        </div>
      </div>

      {/* Property Details */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-background border border-border rounded-xl">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            Property Details
          </h3>
          <div className="space-y-3">
            {video.property_type && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Type
                </span>
                <span className="text-sm font-medium">{video.property_type}</span>
              </div>
            )}
            {video.surface && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Surface
                </span>
                <span className="text-sm font-medium">{video.surface} m²</span>
              </div>
            )}
            {video.rooms && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Bed className="w-4 h-4" />
                  Rooms
                </span>
                <span className="text-sm font-medium">{video.rooms}</span>
              </div>
            )}
            {video.building_year && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Built
                </span>
                <span className="text-sm font-medium">{video.building_year}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            Price Estimation
          </h3>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              ${(video.estimated_price_min || 0).toLocaleString()} - $
              {(video.estimated_price_max || 0).toLocaleString()}
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">Based on market data and AI analysis</p>
          </div>
        </div>
      </div>

      {/* Marketing Content */}
      {video.description && (
        <div className="p-6 bg-background border border-border rounded-xl mb-8">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Generated Marketing Content
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Title</h4>
              <p className="text-foreground font-medium">{video.title}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Description</h4>
              <p className="text-foreground leading-relaxed">{video.description}</p>
            </div>
            {video.hashtags && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Hashtags</h4>
                <p className="text-primary">{video.hashtags}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Share2 className="w-4 h-4" />
          Share Results
        </Button>
      </div>
    </div>
  )
}
