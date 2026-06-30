import { useCallback, useEffect, useRef, useState } from 'react'
import { audioEngine } from '../audio/AudioEngine'

type BlowError = 'denied' | 'unsupported' | null

/**
 * Listens to the microphone and reports breath strength (0–1) every frame.
 * Audio processing (noise suppression / AGC) is disabled so an actual blow
 * isn't filtered out. The analyser is never connected to the speakers, so it
 * only measures — it makes no sound.
 */
export function useBlow(onIntensity: (x: number) => void) {
  // keep the latest callback in a ref so start()/stop() stay stable
  const cbRef = useRef(onIntensity)
  useEffect(() => {
    cbRef.current = onIntensity
  }, [onIntensity])

  const [active, setActive] = useState(false)
  const [error, setError] = useState<BlowError>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef(0)
  const smoothRef = useRef(0)

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    smoothRef.current = 0
    cbRef.current(0)
    setActive(false)
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('unsupported')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      streamRef.current = stream
      const ctx = audioEngine.context
      if (ctx.state === 'suspended') await ctx.resume()

      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.3
      src.connect(analyser) // analyser only — no connection to destination

      const data = new Float32Array(analyser.fftSize)
      setError(null)
      setActive(true)

      const loop = () => {
        analyser.getFloatTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
        const rms = Math.sqrt(sum / data.length)

        // map the breath band to 0–1 with a noise-floor gate
        const floor = 0.02
        const ceil = 0.22
        let x = (rms - floor) / (ceil - floor)
        x = Math.max(0, Math.min(1, x))
        if (x < 0.05) x = 0

        smoothRef.current += (x - smoothRef.current) * 0.4
        cbRef.current(smoothRef.current < 0.01 ? 0 : smoothRef.current)
        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    } catch {
      setError('denied')
      setActive(false)
    }
  }, [])

  useEffect(() => () => stop(), [stop])

  return { active, error, start, stop }
}
