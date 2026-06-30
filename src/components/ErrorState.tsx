import { BatikBackground } from './ornaments'

export function ErrorState({
  kind,
  detail,
  onRetry,
  onBrowse,
}: {
  kind: 'NO_API_KEY' | 'RATE_LIMIT' | 'LOW_CONFIDENCE' | 'FAIL'
  detail?: string
  onRetry: () => void
  onBrowse: () => void
}) {
  const noKey = kind === 'NO_API_KEY'
  const rateLimited = kind === 'RATE_LIMIT'
  const lowConf = kind === 'LOW_CONFIDENCE'

  const title = noKey
    ? 'Add your Gemini key'
    : rateLimited
      ? 'Gemini needs a breath'
      : lowConf
        ? 'Unable to identify an instrument'
        : 'The vision blurred'
  const body = noKey
    ? 'Live photo recognition needs a Google Gemini API key. Drop it into your .env file and reload — or step inside and start playing right now.'
    : rateLimited
      ? 'You’ve hit the free-tier rate limit. Wait a few seconds and try again — or browse the collection and play right now.'
      : lowConf
        ? 'We couldn’t confidently match this to one of the seven instruments. Fill the frame with a single instrument in good light and try again — or browse the collection to play any of them.'
        : 'We couldn’t quite recognise that instrument. Try another angle in better light, or choose one from the collection.'

  return (
    <div className="screen error">
      <BatikBackground />

      <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {noKey ? (
          <>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V8a5 5 0 0 1 10 0v3" />
            <circle cx="12" cy="16.5" r="1.4" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
          </>
        )}
      </svg>

      <h2 className="serif">{title}</h2>
      <p>{body}</p>

      {noKey && <code className="key-hint">VITE_GEMINI_API_KEY = your-key-here</code>}
      {!noKey && !rateLimited && detail && <code className="key-hint">{detail}</code>}

      <div className="error-cta">
        {!noKey && (
          <button className="btn btn-gold" onClick={onRetry}>
            Try another photo
          </button>
        )}
        <button className={`btn ${noKey ? 'btn-gold' : 'btn-ghost'}`} onClick={onBrowse}>
          Browse the Collection
        </button>
      </div>
    </div>
  )
}
