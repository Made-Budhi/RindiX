// ── Cheap, deterministic image sanity check ──────────────────────────
// Runs in the browser before we spend a Gemini call. Catches the obvious
// "I scanned a black screen / a blank wall" cases by measuring how dark and
// how flat (detail-free) the frame is. Conservative thresholds so a real,
// dimly-lit instrument photo — which always has edges and highlights — passes.

export interface ImageQuality {
  meanLuminance: number // 0–255
  contrast: number // stdev of luminance, 0–255
  blank: boolean // almost no detail (flat colour, black/white screen)
  tooDark: boolean // essentially black
  tooBright: boolean // blown out by glare
}

const OK: ImageQuality = {
  meanLuminance: 128,
  contrast: 50,
  blank: false,
  tooDark: false,
  tooBright: false,
}

export function analyzeImage(dataUrl: string): Promise<ImageQuality> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const n = 64 // downsample — we only need overall statistics
      const canvas = document.createElement('canvas')
      canvas.width = n
      canvas.height = n
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(OK)
      ctx.drawImage(img, 0, 0, n, n)

      let data: Uint8ClampedArray
      try {
        data = ctx.getImageData(0, 0, n, n).data
      } catch {
        return resolve(OK) // never block the flow on a read failure
      }

      let sum = 0
      const lum: number[] = []
      for (let i = 0; i < data.length; i += 4) {
        const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        lum.push(l)
        sum += l
      }
      const mean = sum / lum.length
      let variance = 0
      for (const l of lum) variance += (l - mean) ** 2
      const stdev = Math.sqrt(variance / lum.length)

      resolve({
        meanLuminance: mean,
        contrast: stdev,
        blank: stdev < 6, // near-uniform: a flat colour or empty frame
        tooDark: mean < 14, // essentially black
        tooBright: mean > 244 && stdev < 10, // washed-out white
      })
    }
    img.onerror = () => resolve(OK)
    img.src = dataUrl
  })
}
