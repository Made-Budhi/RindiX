import { useEffect, useState } from 'react'
import { audioEngine } from '../audio/AudioEngine'
import { BatikBackground, BrandMark, CornerFiligree } from './ornaments'

export function Splash({ onBegin }: { onBegin: () => void }) {
  const [open, setOpen] = useState(false)

  // The candi bentar (split temple gate) parts on entry.
  useEffect(() => {
    const t = window.setTimeout(() => setOpen(true), 380)
    return () => window.clearTimeout(t)
  }, [])

  const begin = () => {
    void audioEngine.unlock() // unlock audio on this user gesture
    onBegin()
  }

  return (
    <div className="screen splash">
      <BatikBackground />
      <CornerFiligree pos="tl" />
      <CornerFiligree pos="tr" />
      <CornerFiligree pos="bl" />
      <CornerFiligree pos="br" />

      <div className="brand">
        <BrandMark className="brand-mark" />
        <h1 className="brand-title serif">
          Rindi<span className="x gold-text">X</span>
        </h1>
        <span className="eyebrow">Interactive Gamelan Vision</span>
        <p className="brand-sub">
          Point your camera at a sleeping Balinese instrument — and wake its voice in your hands.
        </p>
      </div>

      <div className="splash-cta">
        <button className="btn btn-gold" onClick={begin}>
          Enter the Pavilion
        </button>
      </div>


      <div className={`gate${open ? ' opening' : ''}`} aria-hidden>
        <div className="gate-half" />
        <div className="gate-half" />
      </div>
    </div>
  )
}
