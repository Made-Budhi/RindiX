import { useCallback, useEffect, useRef, useState } from 'react'
import { audioEngine } from '../../audio/AudioEngine'
import { useBlow } from '../../hooks/useBlow'
import type { InstrumentDef } from '../../types'

const HOLES = 6
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : '')

export function SulingInstrument({ def }: { def: InstrumentDef }) {
  const scale = def.pads // 7 pelog tones, low → high
  const [covered, setCovered] = useState<boolean[]>(() => Array(HOLES).fill(true))
  const [micMode, setMicMode] = useState(false)
  const meterRef = useRef<HTMLSpanElement>(null)

  const count = covered.filter(Boolean).length
  const noteIndex = Math.max(0, Math.min(scale.length - 1, scale.length - 1 - count))
  const note = scale[noteIndex]
  const noteName = cap(note?.label ?? '') + (noteIndex >= 5 ? '′' : '')

  // Build the sustained flute graph while this screen is open.
  useEffect(() => {
    audioEngine.fluteEnsure()
    return () => {
      audioEngine.fluteBreath(0)
      audioEngine.fluteDispose()
    }
  }, [])

  // Glide to the new pitch whenever the fingering changes.
  useEffect(() => {
    if (note?.freq) audioEngine.fluteFreq(note.freq)
  }, [note?.freq])

  // Breath from the mic → flute gain + the on-screen meter.
  const onIntensity = useCallback((x: number) => {
    audioEngine.fluteBreath(x)
    if (meterRef.current) meterRef.current.style.transform = `scaleX(${Math.max(0.02, x)})`
  }, [])
  const blow = useBlow(onIntensity)

  // If the mic is blocked, fall back to the button automatically.
  useEffect(() => {
    if (blow.error) setMicMode(false)
  }, [blow.error])

  const toggleHole = (i: number) => {
    audioEngine.fluteEnsure()
    setCovered((c) => {
      const next = c.slice()
      next[i] = !next[i]
      return next
    })
  }

  const pressBlow = (e: React.PointerEvent) => {
    e.preventDefault()
    audioEngine.fluteEnsure()
    audioEngine.fluteBreath(1)
  }
  const releaseBlow = () => audioEngine.fluteBreath(0)

  const enableMic = async () => {
    audioEngine.fluteEnsure()
    setMicMode(true)
    await blow.start()
  }
  const disableMic = () => {
    blow.stop()
    setMicMode(false)
    audioEngine.fluteBreath(0)
  }

  return (
    <div className="suling">
      <div className="suling-readout">
        <span className="eyebrow">Now sounding</span>
        <div className="suling-note serif gold-text">{noteName || '—'}</div>
        <div className="suling-fingering">
          {count} of {HOLES} holes covered
        </div>
      </div>

      <div className="suling-body">
        <span className="suling-mouth" />
        <span className="suling-ring" />
        <div className="suling-holes">
          {covered.map((cv, i) => (
            <button
              key={i}
              className={`fhole${cv ? ' covered' : ''}`}
              onPointerDown={(e) => {
                e.preventDefault()
                toggleHole(i)
              }}
              aria-label={`Hole ${i + 1} ${cv ? 'covered' : 'open'}`}
            />
          ))}
        </div>
        <span className="suling-tip" />
      </div>

      <div className="suling-controls">
        {micMode ? (
          <div className="breath-box">
            <div className="breath-meter">
              <span ref={meterRef} />
            </div>
            <div className="breath-hint">
              {blow.active ? 'Blow softly into your microphone' : 'Allow the microphone, then blow…'}
            </div>
            <button className="btn btn-ghost" onClick={disableMic}>
              Use the button instead
            </button>
          </div>
        ) : (
          <>
            <button
              className="blow-btn"
              onPointerDown={pressBlow}
              onPointerUp={releaseBlow}
              onPointerLeave={releaseBlow}
              onPointerCancel={releaseBlow}
            >
              <BreathIcon /> Blow &amp; hold
            </button>
            <button className="mic-cta" onClick={enableMic}>
              <MicIcon /> Blow with your breath
            </button>
            {blow.error === 'denied' && <div className="mic-err">Microphone blocked — use the button above.</div>}
            {blow.error === 'unsupported' && <div className="mic-err">No microphone here — use the button above.</div>}
          </>
        )}
      </div>

      <p className="suling-guide">Cover holes to lower the pitch · lift to raise · blow to sound</p>
    </div>
  )
}

function BreathIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 12h15a3 3 0 1 1-3 3" />
      <path d="M3 16h8" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  )
}
