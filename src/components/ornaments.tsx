import type { InstrumentId } from '../types'

// ── Subtle batik backdrop (encoded SVG, tiled by CSS) ────────────────
const BATIK = encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='132' height='132' viewBox='0 0 132 132'>
  <g fill='none' stroke='#cba135' stroke-width='1' opacity='0.5'>
    <circle cx='66' cy='66' r='20'/>
    <circle cx='66' cy='66' r='9'/>
    <path d='M66 14 C74 34 74 46 66 56 C58 46 58 34 66 14Z'/>
    <path d='M66 118 C74 98 74 86 66 76 C58 86 58 98 66 118Z'/>
    <path d='M14 66 C34 58 46 58 56 66 C46 74 34 74 14 66Z'/>
    <path d='M118 66 C98 58 86 58 76 66 C86 74 98 74 118 66Z'/>
    <circle cx='0' cy='0' r='6'/><circle cx='132' cy='0' r='6'/>
    <circle cx='0' cy='132' r='6'/><circle cx='132' cy='132' r='6'/>
  </g>
</svg>`)

export function BatikBackground() {
  return (
    <div
      className="batik-bg"
      style={{ backgroundImage: `url("data:image/svg+xml,${BATIK}")` }}
      aria-hidden
    />
  )
}

export function CornerFiligree({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <svg className={`corner-filigree ${pos}`} viewBox="0 0 100 100" fill="none" aria-hidden>
      <path
        d="M4 4 L4 40 M4 4 L40 4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 16 C26 16 40 24 40 48 C40 60 48 66 60 66"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M16 4 C16 26 24 40 48 40 C60 40 66 48 66 60"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="40" cy="40" r="3.5" fill="currentColor" />
      <path d="M4 28 C14 28 20 33 20 44" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <path d="M28 4 C28 14 33 20 44 20" stroke="currentColor" strokeWidth="1" opacity="0.7" />
    </svg>
  )
}

export function LotusMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 C13.6 8 13.6 11 12 13 C10.4 11 10.4 8 12 3Z" fill="currentColor" />
      <path d="M12 13 C8 9 5 9 3 10 C5 14 9 14.5 12 13Z" fill="currentColor" opacity="0.85" />
      <path d="M12 13 C16 9 19 9 21 10 C19 14 15 14.5 12 13Z" fill="currentColor" opacity="0.85" />
      <path d="M12 13 C9 12 6.5 13 5 16 C9 17 11 15.5 12 13Z" fill="currentColor" opacity="0.6" />
      <path d="M12 13 C15 12 17.5 13 19 16 C15 17 13 15.5 12 13Z" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

export function LotusDivider() {
  return (
    <div className="divider" aria-hidden>
      <LotusMark />
    </div>
  )
}

/** The RindiX gong-mandala logo. */
export function BrandMark({ className }: { className?: string }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45)
  return (
    <svg className={className} viewBox="0 0 132 132" fill="none" aria-hidden>
      <defs>
        <linearGradient id="bm-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7e6a8" />
          <stop offset="48%" stopColor="#cba135" />
          <stop offset="100%" stopColor="#6f5417" />
        </linearGradient>
      </defs>
      <circle cx="66" cy="66" r="60" stroke="url(#bm-gold)" strokeWidth="2" opacity="0.5" />
      <circle cx="66" cy="66" r="44" stroke="url(#bm-gold)" strokeWidth="3" />
      {petals.map((deg) => (
        <path
          key={deg}
          d="M66 14 C72 32 72 42 66 52 C60 42 60 32 66 14Z"
          fill="url(#bm-gold)"
          transform={`rotate(${deg} 66 66)`}
          opacity="0.9"
        />
      ))}
      <circle cx="66" cy="66" r="20" fill="#120d08" stroke="url(#bm-gold)" strokeWidth="2.5" />
      <circle cx="66" cy="66" r="9" fill="url(#bm-gold)" />
    </svg>
  )
}

// ── Line-art instrument glyphs for the picker ────────────────────────
export function InstrumentGlyph({ id, className }: { id: InstrumentId; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 48 48',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (id) {
    case 'gangsa':
      return (
        <svg {...common} aria-hidden>
          <rect x="6" y="14" width="36" height="22" rx="3" />
          {[12, 18, 24, 30, 36].map((x) => (
            <line key={x} x1={x} y1="17" x2={x} y2="33" />
          ))}
        </svg>
      )
    case 'reyong':
      return (
        <svg {...common} aria-hidden>
          <line x1="6" y1="30" x2="42" y2="30" />
          {[12, 21, 30, 39].map((x) => (
            <g key={x}>
              <circle cx={x} cy="22" r="6" />
              <circle cx={x} cy="22" r="1.6" fill="currentColor" />
            </g>
          ))}
        </svg>
      )
    case 'gong':
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="17" />
          <circle cx="24" cy="24" r="9" />
          <circle cx="24" cy="24" r="3" fill="currentColor" />
        </svg>
      )
    case 'kempur':
      return (
        <svg {...common} aria-hidden>
          <line x1="24" y1="5" x2="24" y2="11" />
          <circle cx="24" cy="27" r="14" />
          <circle cx="24" cy="27" r="4" fill="currentColor" />
        </svg>
      )
    case 'cengceng':
      return (
        <svg {...common} aria-hidden>
          <circle cx="19" cy="24" r="12" />
          <circle cx="29" cy="24" r="12" />
          <circle cx="19" cy="24" r="2.4" fill="currentColor" />
          <circle cx="29" cy="24" r="2.4" fill="currentColor" />
        </svg>
      )
    case 'kendang':
      return (
        <svg {...common} aria-hidden>
          <rect x="7" y="16" width="15" height="22" rx="6" />
          <rect x="26" y="12" width="15" height="26" rx="6" />
          <ellipse cx="14.5" cy="16" rx="7.5" ry="2.6" />
          <ellipse cx="33.5" cy="12" rx="7.5" ry="2.6" />
        </svg>
      )
    case 'rindik':
      return (
        <svg {...common} aria-hidden>
          <line x1="8" y1="12" x2="8" y2="38" />
          <line x1="40" y1="12" x2="40" y2="38" />
          {[14, 20, 26, 32, 38].map((x, i) => (
            <line key={x} x1={x} y1={14 + i} x2={x} y2={36 - i} strokeWidth="2.4" />
          ))}
        </svg>
      )
  }
}
