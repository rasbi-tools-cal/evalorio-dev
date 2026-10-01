/**
 * Client-side photo preparation: decode, downscale to max 1600 px, re-encode (WebP, JPEG fallback).
 * Re-encoding through a canvas drops all EXIF metadata, including GPS coordinates.
 */
const MAX_SIDE = 1600
const MAX_INPUT_BYTES = 30 * 1024 * 1024
const ACCEPTED = /^image\/(jpeg|png|webp|heic|heif|avif)$/

export interface PreparedPhoto {
  blob: Blob
  ext: "webp" | "jpg"
  width: number
  height: number
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" })
    } catch {
      // Fall through (e.g. HEIC in Safari decodes via <img> only).
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = "async"
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!ACCEPTED.test(file.type) || file.size > MAX_INPUT_BYTES) throw new Error("unsupported")
  const source = await decode(file)
  const w = "naturalWidth" in source ? source.naturalWidth : source.width
  const h = "naturalHeight" in source ? source.naturalHeight : source.height
  if (!w || !h) throw new Error("unsupported")

  const scale = Math.min(1, MAX_SIDE / Math.max(w, h))
  const width = Math.round(w * scale)
  const height = Math.round(h * scale)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("unsupported")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(source, 0, 0, width, height)
  if ("close" in source) source.close()

  const webp = await toBlob(canvas, "image/webp", 0.75)
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp", width, height }
  const jpeg = await toBlob(canvas, "image/jpeg", 0.78)
  if (!jpeg) throw new Error("unsupported")
  return { blob: jpeg, ext: "jpg", width, height }
}
