import type { Identification, InstrumentDef } from '../types'
import { BatikBackground, BrandMark } from './ornaments'

export function ResultReveal({
  photo,
  ident,
  def,
  onPlay,
  onRescan,
}: {
  photo: string | null
  ident: Identification
  def: InstrumentDef
  onPlay: () => void
  onRescan: () => void
}) {
  const pct = Math.round(ident.confidence * 100)

  return (
    <div className="screen result">
      <BatikBackground />

      <div className="result-photo-wrap">
        {photo ? <img src={photo} alt={`Captured ${def.name}`} /> : <BrandMark />}
      </div>

      <span className="eyebrow">{ident.offline ? 'From the Collection' : 'Identified'}</span>
      <h2 className="result-name serif gold-text">{def.name}</h2>
      <div className="result-pron">
        /{def.pronunciation}/ · {def.subtitle}
      </div>

      <p className="observation">
        <span className="q">“</span>
        {ident.observation}
        <span className="q">”</span>
      </p>

      <div className="confidence">
        Match
        <span className="bar">
          <i style={{ width: `${pct}%` }} />
        </span>
        {pct}%
      </div>

      <div className="result-cta">
        <button className="btn btn-gold" onClick={onPlay}>
          Play the {def.name}
        </button>
        <button className="btn btn-ghost" onClick={onRescan}>
          Scan another
        </button>
      </div>
    </div>
  )
}
