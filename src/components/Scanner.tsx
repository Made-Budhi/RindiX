import { useEffect } from 'react'
import { fileToDataUrl, useCamera } from '../hooks/useCamera'
import { BatikBackground } from './ornaments'

export function Scanner({
  onCapture,
  onBrowse,
}: {
  onCapture: (dataUrl: string) => void
  onBrowse: () => void
}) {
  const { videoRef, active, error, start, capture } = useCamera()

  useEffect(() => {
    void start()
  }, [start])

  const snap = () => {
    const url = capture()
    if (url) onCapture(url)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onCapture(await fileToDataUrl(file))
  }

  return (
    <div className="screen scanner">
      <BatikBackground />

      <div className="scan-head">
        <span className="eyebrow">Step One</span>
        <h2 className="serif">Find an Instrument</h2>
        <p>Frame the gamelan piece inside the golden brackets</p>
      </div>

      <div className="viewfinder">
        <video ref={videoRef} playsInline muted autoPlay />

        {!active && (
          <div className="vf-placeholder">
            <CameraIcon />
            <p>
              {error === 'denied'
                ? 'Camera access was blocked. Upload a photo instead, or browse the collection below.'
                : error === 'unsupported'
                  ? 'This device has no camera here — upload a photo or browse the collection.'
                  : 'Waking the camera…'}
            </p>
          </div>
        )}

        <span className="vf-bracket tl" />
        <span className="vf-bracket tr" />
        <span className="vf-bracket bl" />
        <span className="vf-bracket br" />
        {active && <span className="scan-line" />}
      </div>

      <div className="capture-bar">
        <label className="side-action">
          <input className="upload-input" type="file" accept="image/*" capture="environment" onChange={onFile} />
          <span className="btn-round" aria-hidden>
            <UploadIcon />
          </span>
          Upload
        </label>

        <button className="shutter" onClick={snap} disabled={!active} aria-label="Capture photo" />

        <button className="side-action" onClick={onBrowse}>
          <span className="btn-round" aria-hidden>
            <GridIcon />
          </span>
          Browse
        </button>
      </div>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2l.9-1.5a1 1 0 0 1 .85-.5h5.1a1 1 0 0 1 .85.5L15.3 6h3.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M12 16V5" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}
