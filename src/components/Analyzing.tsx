import { useEffect, useState } from 'react'

const STATUSES = [
  'Reading the bronze…',
  'Consulting the lontar palm-leaves…',
  'Measuring the tuning…',
  'Awakening its voice…',
]

export function Analyzing({ photo }: { photo: string | null }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => setI((v) => (v + 1) % STATUSES.length), 1300)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div className="screen analyzing">
      <div className="mandala">
        <svg viewBox="0 0 168 168" fill="none" aria-hidden>
          <g className="ring-a">
            <circle
              cx="84"
              cy="84"
              r="78"
              stroke="#cba135"
              strokeWidth="1.5"
              strokeDasharray="2 10"
              opacity="0.8"
            />
            <circle cx="84" cy="84" r="70" stroke="#6f5417" strokeWidth="1" opacity="0.6" />
          </g>
          <g className="ring-b">
            {Array.from({ length: 12 }, (_, k) => k * 30).map((deg) => (
              <path
                key={deg}
                d="M84 22 C88 34 88 40 84 48 C80 40 80 34 84 22Z"
                fill="#cba135"
                opacity="0.85"
                transform={`rotate(${deg} 84 84)`}
              />
            ))}
          </g>
          <circle className="core" cx="84" cy="84" r="52" stroke="#f0d27f" strokeWidth="1" opacity="0.5" />
        </svg>
        {photo && <img className="analyzing-photo" src={photo} alt="" />}
      </div>

      <div className="center-col" style={{ gap: 8 }}>
        <div className="status-line serif" key={i}>
          {STATUSES[i]}
        </div>
        <div className="status-sub">Gemini Vision is identifying your instrument</div>
      </div>
    </div>
  )
}
