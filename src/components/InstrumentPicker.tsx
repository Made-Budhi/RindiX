import { INSTRUMENT_LIST } from '../data/instruments'
import type { InstrumentId } from '../types'
import { BatikBackground, InstrumentGlyph } from './ornaments'

export function InstrumentPicker({
  onPick,
  onBack,
}: {
  onPick: (id: InstrumentId) => void
  onBack: () => void
}) {
  return (
    <div className="screen picker">
      <BatikBackground />

      <div className="player-head">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <BackIcon />
        </button>
        <div className="titles">
          <h2 className="serif">The Collection</h2>
          <span>Seven voices of the gamelan</span>
        </div>
      </div>

      <div className="picker-head">
        <p>Tap any instrument to play it now — no camera required.</p>
      </div>

      <div className="picker-grid">
        {INSTRUMENT_LIST.map((def) => (
          <button
            key={def.id}
            className="picker-card"
            style={{ ['--accent']: def.accent } as React.CSSProperties}
            onClick={() => onPick(def.id)}
          >
            <span className="glow" />
            <InstrumentGlyph id={def.id} className="pc-icon" />
            <h3 className="serif">{def.name}</h3>
            <span>{def.subtitle}</span>
          </button>
        ))}
      </div>
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
