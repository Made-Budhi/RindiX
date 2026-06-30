import { useEffect, useState } from 'react'
import { generateTrivia } from '../services/gemini'
import type { InstrumentDef } from '../types'
import { LotusMark } from './ornaments'

export function TriviaPanel({ def }: { def: InstrumentDef }) {
  const [facts, setFacts] = useState<string[]>(def.trivia)
  const [loading, setLoading] = useState(true)
  const [isAi, setIsAi] = useState(false)
  const [idx, setIdx] = useState(0)

  // Ask Gemini for fresh trivia; fall back to curated manifest facts.
  useEffect(() => {
    let live = true
    setFacts(def.trivia)
    setIsAi(false)
    setLoading(true)
    setIdx(0)
    generateTrivia(def.id).then((res) => {
      if (!live) return
      if (res && res.length) {
        setFacts(res)
        setIsAi(true)
      }
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [def.id, def.trivia])

  // Auto-advance the cards.
  useEffect(() => {
    if (facts.length < 2) return
    const t = window.setInterval(() => setIdx((v) => (v + 1) % facts.length), 5400)
    return () => window.clearInterval(t)
  }, [facts])

  return (
    <section className="trivia">
      <div className="trivia-top">
        <span className="eyebrow">Learn · {def.name}</span>
        {loading ? (
          <span className="ai-badge loading">
            <SpinIcon /> Curating
          </span>
        ) : isAi ? (
          <span className="ai-badge">
            <SparkIcon /> AI Curator
          </span>
        ) : (
          <span className="ai-badge">
            <SparkIcon /> Heritage Archive
          </span>
        )}
      </div>

      <div className="trivia-track">
        <div className="trivia-item" key={idx}>
          <LotusMark className="lotus" />
          <p>{facts[idx]}</p>
        </div>
      </div>

      <div className="trivia-dots">
        {facts.map((_, i) => (
          <button
            key={i}
            className={i === idx ? 'on' : ''}
            onClick={() => setIdx(i)}
            aria-label={`Fact ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6z" />
      <path d="M19 14l.8 2.4L22 17l-2.2.6L19 20l-.8-2.4L16 17l2.2-.6z" />
    </svg>
  )
}

function SpinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <g className="spin" style={{ transformOrigin: 'center' }}>
        <path d="M12 3a9 9 0 1 0 9 9" />
      </g>
    </svg>
  )
}
