const TEAM = ['Budhi', 'Suartha', 'Mang Krisna', 'Dewa', 'Indra']

export function Footer({ className = '' }: { className?: string }) {
  return (
    <footer className={`site-footer ${className}`}>
      <span className="footer-title">RindiX Team</span>
      <div className="footer-team">
        {TEAM.flatMap((name, i) =>
          i === 0
            ? [
                <span key={name} className="member">
                  {name}
                </span>,
              ]
            : [
                <span key={`${name}-dot`} className="dot" aria-hidden>
                  ·
                </span>,
                <span key={name} className="member">
                  {name}
                </span>,
              ],
        )}
      </div>
      <span className="footer-tag">Interactive Gamelan Vision · AI for Culture &amp; Creative Heritage</span>
    </footer>
  )
}
