"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Upload, File, X, CreditCard, AlertCircle, ImageIcon, Video } from "lucide-react"
import { LocationSelector, type LocationData } from "@/components/location-selector"
import { PropertyDetailsForm, type PropertyDetailsData } from "@/components/property-details-form"

interface UploadClientProps {
  userEmail: string
  credits: number
  userId: string
}

export default function UploadClient({ userEmail, credits, userId }: UploadClientProps) {
  const router = useRouter()
  const [uploadType, setUploadType] = useState<"video" | "images">("video")
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<LocationData>({
    country: "",
    city: "",
    address: "",
  })
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetailsData>({
    propertyType: "",
    surface: "",
    rooms: "",
    buildingYear: "",
  })

  const maxFiles = uploadType === "video" ? 1 : 10

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }, [])

  const validateFile = (file: File): boolean => {
    if (uploadType === "video") {
      return file.type === "video/mp4" || file.type === "video/quicktime"
    } else {
      return file.type.startsWith("image/") && ["image/jpeg", "image/jpg", "image/png"].includes(file.type)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files).filter(validateFile).slice(0, maxFiles)

      if (droppedFiles.length > 0) {
        setFiles(droppedFiles)
        setError(null)
      }
    },
    [uploadType, maxFiles],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files).filter(validateFile).slice(0, maxFiles) : []

    if (selectedFiles.length > 0) {
      setFiles(selectedFiles)
      setError(null)
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setUploadProgress(0)
    setError(null)
  }

  const handleRemoveAllFiles = () => {
    setFiles([])
    setUploadProgress(0)
    setError(null)
  }

  const handleStartAnalysis = async () => {
    if (files.length === 0 || credits < 1) return

    if (!location.country || !location.city) {
      setError("Please select country and city for accurate pricing")
      return
    }

    if (!propertyDetails.propertyType || !propertyDetails.surface || !propertyDetails.rooms) {
      setError("Please fill in property type, surface, and number of rooms")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      console.log("[v0] Starting upload to Supabase Storage...")

      const formData = new FormData()
      formData.append("uploadType", uploadType)
      formData.append("userId", userId)
      formData.append("country", location.country)
      formData.append("city", location.city)
      if (location.address) {
        formData.append("address", location.address)
      }
      formData.append("propertyType", propertyDetails.propertyType)
      formData.append("surface", propertyDetails.surface)
      formData.append("rooms", propertyDetails.rooms)
      if (propertyDetails.buildingYear) {
        formData.append("buildingYear", propertyDetails.buildingYear)
      }

      files.forEach((file) => {
        formData.append("files", file)
      })

      setUploadProgress(20)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      console.log("[v0] Upload successful:", result)
      setUploadProgress(100)

      setTimeout(() => {
        router.push(`/status?id=${result.jobId}`)
      }, 500)
    } catch (error) {
      console.error("[v0] Error during upload:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleTabChange = (value: string) => {
    setUploadType(value as "video" | "images")
    setFiles([])
    setError(null)
    setUploadProgress(0)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}

      {/* Upload Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-5">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Upload Your Property Media
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Upload videos or photos and let our AI analyze your property
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mt-4">
            <CreditCard className="w-4 h-4" />
            <span>
              {credits} {credits === 1 ? "credit" : "credits"} available
            </span>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {credits < 1 && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              You don't have enough credits to analyze media.{" "}
              <Link href="/pricing" className="underline font-semibold">
                Purchase credits
              </Link>{" "}
              to continue.
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-8 lg:p-12">
          <Tabs value={uploadType} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Upload
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Photo Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video">
              {files.length === 0 ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    accept="video/mp4,video/quicktime"
                    onChange={handleFileSelect}
                    className="sr-only"
                    disabled={credits < 1}
                  />
                  <label htmlFor="file-upload" className={credits < 1 ? "cursor-not-allowed" : "cursor-pointer"}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground mb-2">Drag and drop your video here</p>
                        <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                        <Button type="button" disabled={credits < 1}>
                          Select Video File
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">Supported: MP4, MOV • Max size: 500MB</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File Preview */}
                  <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <File className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{files[0].name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(files[0].size)} • {files[0].type.split("/")[1].toUpperCase()}
                      </p>
                    </div>
                    {!isUploading && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(0)} className="flex-shrink-0">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Location Selector and Property Details Form */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <LocationSelector value={location} onChange={setLocation} />
                    <PropertyDetailsForm value={propertyDetails} onChange={setPropertyDetails} />
                  </div>

                  {/* Upload Progress */}
                  {isUploading && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {uploadProgress < 40 ? "Uploading video..." : "Processing..."}
                        </span>
                        <span className="font-medium text-foreground">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleStartAnalysis}
                      disabled={
                        isUploading ||
                        credits < 1 ||
                        !location.country ||
                        !location.city ||
                        !propertyDetails.propertyType ||
                        !propertyDetails.surface ||
                        !propertyDetails.rooms
                      }
                      className="flex-1"
                      size="lg"
                    >
                      {isUploading ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Start Analysis (1 credit)
                        </>
                      )}
                    </Button>
                    {!isUploading && (
                      <Button variant="outline" onClick={handleRemoveAllFiles} size="lg">
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="images">
              {files.length === 0 ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/jpeg,image/jpg,image/png"
                    multiple
                    onChange={handleFileSelect}
                    className="sr-only"
                    disabled={credits < 1}
                  />
                  <label htmlFor="image-upload" className={credits < 1 ? "cursor-not-allowed" : "cursor-pointer"}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground mb-2">Drag and drop your photos here</p>
                        <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                        <Button type="button" disabled={credits < 1}>
                          Select Photo Files
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Supported: JPG, PNG • Max {maxFiles} photos • Max 10MB each
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Files Grid Preview */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                        {!isUploading && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {files.length} {files.length === 1 ? "photo" : "photos"} selected
                    </span>
                    <span>{formatFileSize(files.reduce((acc, file) => acc + file.size, 0))} total</span>
                  </div>

                  {/* Location Selector and Property Details Form */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <LocationSelector value={location} onChange={setLocation} />
                    <PropertyDetailsForm value={propertyDetails} onChange={setPropertyDetails} />
                  </div>

                  {/* Upload Progress */}
                  {isUploading && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {uploadProgress < 40 ? "Uploading photos..." : "Processing..."}
                        </span>
                        <span className="font-medium text-foreground">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleStartAnalysis}
                      disabled={
                        isUploading ||
                        credits < 1 ||
                        !location.country ||
                        !location.city ||
                        !propertyDetails.propertyType ||
                        !propertyDetails.surface ||
                        !propertyDetails.rooms
                      }
                      className="flex-1"
                      size="lg"
                    >
                      {isUploading ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Start Analysis (1 credit)
                        </>
                      )}
                    </Button>
                    {!isUploading && (
                      <Button variant="outline" onClick={handleRemoveAllFiles} size="lg">
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
