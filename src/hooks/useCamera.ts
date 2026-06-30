import { useCallback, useEffect, useRef, useState } from 'react'

/** Read a picked File into a base64 data URL (gallery / file-input fallback). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.readAsDataURL(file)
  })
}

interface CameraApi {
  videoRef: React.RefObject<HTMLVideoElement>
  active: boolean
  error: string | null
  start: () => Promise<void>
  stop: () => void
  /** Grab the current frame as a square JPEG data URL. */
  capture: () => string | null
}

export function useCamera(): CameraApi {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('unsupported')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play().catch(() => {})
      }
      setError(null)
      setActive(true)
    } catch {
      setError('denied')
      setActive(false)
    }
  }, [])

  const capture = useCallback((): string | null => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return null
    const side = Math.min(v.videoWidth, v.videoHeight)
    const target = 768
    const canvas = document.createElement('canvas')
    canvas.width = target
    canvas.height = target
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const sx = (v.videoWidth - side) / 2
    const sy = (v.videoHeight - side) / 2
    ctx.drawImage(v, sx, sy, side, side, 0, 0, target, target)
    return canvas.toDataURL('image/jpeg', 0.85)
  }, [])

  useEffect(() => () => stop(), [stop])

  return { videoRef, active, error, start, stop, capture }
}
