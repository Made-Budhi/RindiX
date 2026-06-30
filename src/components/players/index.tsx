import { useCallback, useEffect, useRef, useState } from 'react'
import { audioEngine } from '../../audio/AudioEngine'
import type { InstrumentDef, PadSpec } from '../../types'
import { SulingInstrument } from './Suling'

// ── shared interaction helpers ───────────────────────────────────────

type Strike = (pad: PadSpec, e: React.PointerEvent) => void

function haptic(ms = 9) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* not supported — silent */
  }
}

function spawnRipple(stage: HTMLElement, clientX: number, clientY: number, size: number) {
  const rect = stage.getBoundingClientRect()
  const r = document.createElement('span')
  r.className = 'ripple'
  r.style.left = `${clientX - rect.left}px`
  r.style.top = `${clientY - rect.top}px`
  r.style.width = `${size}px`
  r.style.height = `${size}px`
  stage.appendChild(r)
  window.setTimeout(() => r.remove(), 600)
}

const press = (e: React.PointerEvent) => e.currentTarget.classList.add('pressed')
const release = (e: React.PointerEvent) => e.currentTarget.classList.remove('pressed')

// ── the stage wrapper that every instrument lives in ─────────────────

export function InstrumentStage({ def }: { def: InstrumentDef }) {
  const stageRef = useRef<HTMLDivElement>(null)

  const strike = useCallback<Strike>((pad, e) => {
    audioEngine.play(pad)
    haptic(pad.voice === 'gong' ? 22 : pad.voice === 'drum' ? 16 : 9)
    if (stageRef.current) {
      const size = pad.voice === 'gong' ? 280 : pad.voice === 'cymbal' ? 170 : pad.voice === 'drum' ? 150 : 130
      spawnRipple(stageRef.current, e.clientX, e.clientY, size)
    }
  }, [])

  return (
    <div className="stage" ref={stageRef}>
      <div
        className="stage-accent"
        style={{ background: `radial-gradient(circle at 50% 28%, ${def.accent}, transparent 62%)` }}
        aria-hidden
      />
      <LayoutFor def={def} strike={strike} />
      {def.layout !== 'suling' && <div className="hint-tap">Tap · hold · play with many fingers</div>}
    </div>
  )
}

function LayoutFor({ def, strike }: { def: InstrumentDef; strike: Strike }) {
  switch (def.layout) {
    case 'bars':
      return <BarsInstrument def={def} strike={strike} />
    case 'reyong':
      return <ReyongInstrument def={def} strike={strike} />
    case 'gong':
      return <GongInstrument def={def} strike={strike} />
    case 'cengceng':
      return <CengCengInstrument def={def} strike={strike} />
    case 'kendang':
      return <KendangInstrument def={def} strike={strike} />
    case 'suling':
      return <SulingInstrument def={def} />
  }
}

// ── Gangsa & Rindik — tuned bars ─────────────────────────────────────

function BarsInstrument({ def, strike }: { def: InstrumentDef; strike: Strike }) {
  const isBamboo = def.pads[0]?.voice === 'bamboo'
  const n = def.pads.length
  return (
    <div className="bars">
      {def.pads.map((pad, i) => {
        const t = n > 1 ? i / (n - 1) : 0 // 0 = lowest note, 1 = highest
        const style: Record<string, string | number> = {
          flexGrow: 1 - t * 0.24, // higher notes a touch narrower…
          height: `${100 - t * 42}%`, // …and noticeably shorter
        }
        if (isBamboo) style['--bar-face'] = 'linear-gradient(155deg,#e2cf94,#b2914f 52%,#7c6231)'
        return (
          <button
            key={pad.id}
            className={`bar${isBamboo ? ' bamboo-bar' : ''}`}
            style={style as React.CSSProperties}
            onPointerDown={(e) => {
              e.preventDefault()
              press(e)
              strike(pad, e)
            }}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
          >
            <span className="note">{pad.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Reyong — row of bossed kettles ───────────────────────────────────

function ReyongInstrument({ def, strike }: { def: InstrumentDef; strike: Strike }) {
  const n = def.pads.length
  const railRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  const update = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft >= max - 4)
  }, [])

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    update()
    // ResizeObserver fires once layout settles (and on any later size change),
    // so the arrows reflect real scrollability from the first frame.
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [update])

  const nudge = (dir: number) => {
    const el = railRef.current
    if (!el) return
    el.scrollBy({ left: dir * 240, behavior: 'smooth' })
    window.setTimeout(update, 450) // refresh arrows once the glide settles
  }

  // Let a vertical mouse-wheel scroll the rail horizontally.
  const onWheel = (e: React.WheelEvent) => {
    const el = railRef.current
    if (el && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY
      update()
    }
  }

  return (
    <div className="reyong-wrap">
      <button
        className={`reyong-nav left${atStart ? ' hidden' : ''}`}
        onClick={() => nudge(-1)}
        aria-label="Scroll left"
      >
        <Chevron dir="left" />
      </button>

      <div className="reyong-rail" ref={railRef} onScroll={update} onWheel={onWheel}>
        <div className="reyong-track">
          {def.pads.map((pad, i) => {
            const t = n > 1 ? i / (n - 1) : 0
            const size = Math.round(64 - t * 26) // 64px (low) → 38px (high)
            return (
              <button
                key={pad.id}
                className="kettle"
                style={{ width: size, height: size }}
                onPointerDown={(e) => {
                  e.preventDefault()
                  press(e)
                  strike(pad, e)
                }}
                onPointerUp={release}
                onPointerLeave={release}
                onPointerCancel={release}
              >
                <span className="boss" />
                <span className="note">{pad.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        className={`reyong-nav right${atEnd ? ' hidden' : ''}`}
        onClick={() => nudge(1)}
        aria-label="Scroll right"
      >
        <Chevron dir="right" />
      </button>
    </div>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

// ── Gong & Kempur — a single great gong ──────────────────────────────

function GongInstrument({ def, strike }: { def: InstrumentDef; strike: Strike }) {
  const pad = def.pads[0]
  const big = def.id === 'gong'
  const faceRef = useRef<HTMLButtonElement>(null)

  const hit = (e: React.PointerEvent) => {
    e.preventDefault()
    strike(pad, e)
    const el = faceRef.current
    if (!el) return
    el.classList.remove('struck')
    void el.offsetWidth // restart animation
    el.classList.add('struck')
    const halo = document.createElement('span')
    halo.className = 'gong-halo'
    el.parentElement?.appendChild(halo)
    window.setTimeout(() => halo.remove(), 1100)
  }

  return (
    <div className="gong-wrap">
      <button
        ref={faceRef}
        className="gong-face"
        style={{ '--gong-size': big ? '270px' : '202px' } as React.CSSProperties}
        onPointerDown={hit}
      >
        <span className="rim" />
        <span className="rim two" />
        <span className="gong-boss" />
      </button>
    </div>
  )
}

// ── Ceng-Ceng — crashing cymbals ─────────────────────────────────────

function CengCengInstrument({ def, strike }: { def: InstrumentDef; strike: Strike }) {
  const crash = def.pads.find((p) => p.variant === 'crash') ?? def.pads[0]
  const others = def.pads.filter((p) => p.variant !== 'crash')
  const pairRef = useRef<HTMLButtonElement>(null)

  const doCrash = (e: React.PointerEvent) => {
    e.preventDefault()
    strike(crash, e)
    const el = pairRef.current
    if (!el) return
    el.classList.remove('clash')
    void el.offsetWidth
    el.classList.add('clash')
  }

  return (
    <div className="cengceng-stage">
      <button ref={pairRef} className="cymbal-pair" onPointerDown={doCrash}>
        <span className="cymbal left">
          <span className="dome" />
        </span>
        <span className="cymbal right">
          <span className="dome" />
        </span>
      </button>
      <div className="kecek-row">
        {others.map((pad) => (
          <button
            key={pad.id}
            className="kecek"
            onPointerDown={(e) => {
              e.preventDefault()
              press(e)
              strike(pad, e)
            }}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
          >
            {pad.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Kendang — the leading drum pair ──────────────────────────────────

function KendangInstrument({ def, strike }: { def: InstrumentDef; strike: Strike }) {
  // pads: [wadon-center, wadon-edge, lanang-center, lanang-edge]
  const [wc, we, lc, le] = def.pads
  return (
    <div className="kendang-stage">
      <Drum name="Wadon" center={wc} edge={we} strike={strike} />
      <Drum name="Lanang" center={lc} edge={le} strike={strike} />
    </div>
  )
}

function Drum({
  name,
  center,
  edge,
  strike,
}: {
  name: string
  center: PadSpec
  edge: PadSpec
  strike: Strike
}) {
  const hit = (pad: PadSpec) => (e: React.PointerEvent) => {
    e.preventDefault()
    press(e)
    strike(pad, e)
  }
  return (
    <div className="drum">
      <span className="drum-label">{name}</span>
      <span className="drum-body" />
      <button
        className="drum-head center"
        onPointerDown={hit(center)}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
      >
        <span className="zone-tag">{center.label}</span>
      </button>
      <button
        className="drum-head edge"
        onPointerDown={hit(edge)}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
      >
        <span className="zone-tag">{edge.label}</span>
      </button>
    </div>
  )
}
