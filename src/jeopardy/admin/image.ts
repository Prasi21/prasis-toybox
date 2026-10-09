/** Resize + compress a picked image file to a web-friendly WebP in the browser. */

const MAX_WIDTH = 1200
const TARGET_BYTES = 150 * 1024
const QUALITIES = [0.82, 0.72, 0.62, 0.52, 0.42]

export type ProcessedImage = {
  blob: Blob
  name: string
  width: number
  height: number
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      /* fall through */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not read that image.'))
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image encoding failed.'))),
      'image/webp',
      quality,
    )
  })
}

async function shortHash(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return [...new Uint8Array(digest)]
    .slice(0, 4)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function slug(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return cleaned || 'image'
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const bitmap = await loadBitmap(file)
  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported in this browser.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close()

  let blob = await canvasToBlob(canvas, QUALITIES[0])
  for (let i = 1; i < QUALITIES.length && blob.size > TARGET_BYTES; i += 1) {
    blob = await canvasToBlob(canvas, QUALITIES[i])
  }

  const ext = blob.type === 'image/webp' ? 'webp' : 'png'
  const name = `${slug(file.name)}-${await shortHash(blob)}.${ext}`
  return { blob, name, width, height }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export type ProcessedAudio = { blob: Blob; name: string; size: number }

/**
 * Audio is committed as-is (the browser has no fast, reliable encoder). The
 * editor surfaces the size and nudges you to pre-compress large clips.
 */
export async function processAudio(file: File): Promise<ProcessedAudio> {
  const match = /\.([a-z0-9]+)$/i.exec(file.name)
  const ext = (match?.[1] ?? 'mp3').toLowerCase()
  const name = `${slug(file.name)}-${await shortHash(file)}.${ext}`
  return { blob: file, name, size: file.size }
}
