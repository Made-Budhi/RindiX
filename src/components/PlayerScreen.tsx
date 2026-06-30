import { useEffect } from 'react'
import { audioEngine } from '../audio/AudioEngine'
import type { InstrumentDef } from '../types'
import { InstrumentGlyph } from './ornaments'
import { InstrumentStage } from './players'
import { TriviaPanel } from './TriviaPanel'

export function PlayerScreen({ def, onBack }: { def: InstrumentDef; onBack: () => void }) {
  // Decode this instrument's real samples up front for zero-latency play.
  useEffect(() => {
    void audioEngine.unlock()
    void audioEngine.preloadSamples(def.pads.map((p) => p.sampleUrl))
  }, [def])

  return (
    <div className="screen player">
      <div className="player-head">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <div className="titles">
          <h2 className="serif">{def.name}</h2>
          <span>
            {def.scale !== 'unpitched' ? `${def.scale} · ` : ''}
            {def.subtitle}
          </span>
        </div>
        <span className="icon-btn" style={{ color: def.accent }} aria-hidden>
          <InstrumentGlyph id={def.id} />
        </span>
      </div>

      <InstrumentStage def={def} />

      <TriviaPanel def={def} />
    </div>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}
