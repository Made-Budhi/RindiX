import { useCallback, useState } from 'react'
import { audioEngine } from './audio/AudioEngine'
import { INSTRUMENTS } from './data/instruments'
import { identifyInstrument, MIN_CONFIDENCE } from './services/gemini'
import { analyzeImage } from './utils/imageQuality'
import type { Identification, InstrumentId, Screen } from './types'

import { Analyzing } from './components/Analyzing'
import { ErrorState } from './components/ErrorState'
import { InstrumentPicker } from './components/InstrumentPicker'
import { PlayerScreen } from './components/PlayerScreen'
import { ResultReveal } from './components/ResultReveal'
import { Scanner } from './components/Scanner'
import { Splash } from './components/Splash'

const delay = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [photo, setPhoto] = useState<string | null>(null)
  const [ident, setIdent] = useState<Identification | null>(null)
  const [currentId, setCurrentId] = useState<InstrumentId | null>(null)
  const [playBack, setPlayBack] = useState<Screen>('scan')
  const [errKind, setErrKind] = useState<'NO_API_KEY' | 'RATE_LIMIT' | 'LOW_CONFIDENCE' | 'FAIL'>('FAIL')
  const [errDetail, setErrDetail] = useState<string>('')

  // Photo captured → run Gemini Vision (with a graceful minimum reveal time).
  const handleCapture = useCallback(async (url: string) => {
    setPhoto(url)
    setScreen('analyzing')
    try {
      // Deterministic guard: reject blank / near-black / blown-out frames up
      // front (the "I scanned a black screen" case) without an API call.
      const q = await analyzeImage(url)
      if (q.blank || q.tooDark || q.tooBright) {
        await delay(800)
        setErrDetail(
          q.tooDark
            ? 'The photo is almost completely dark — aim at an instrument in good light.'
            : q.tooBright
              ? 'The photo is washed out by glare — try again with softer light.'
              : 'The photo looks blank — frame a single instrument and try again.',
        )
        setErrKind('LOW_CONFIDENCE')
        setScreen('error')
        return
      }

      const [res] = await Promise.all([identifyInstrument(url), delay(1700)])
      if (res.confidence < MIN_CONFIDENCE) {
        const pct = Math.round(res.confidence * 100)
        console.warn(`[RindiX] low confidence ${pct}% (< ${Math.round(MIN_CONFIDENCE * 100)}%) — not shown`)
        setErrDetail(`Closest match was only ${pct}% confident — we need at least ${Math.round(MIN_CONFIDENCE * 100)}%.`)
        setErrKind('LOW_CONFIDENCE')
        setScreen('error')
        return
      }
      setIdent(res)
      setScreen('result')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[RindiX] identification failed:', msg)
      setErrDetail(msg)
      setErrKind(msg === 'NO_API_KEY' ? 'NO_API_KEY' : msg === 'RATE_LIMIT' ? 'RATE_LIMIT' : 'FAIL')
      setScreen('error')
    }
  }, [])

  const playInstrument = useCallback((id: InstrumentId, from: Screen) => {
    void audioEngine.unlock()
    setCurrentId(id)
    setPlayBack(from)
    setScreen('play')
  }, [])

  const resultDef = ident ? INSTRUMENTS[ident.id] : null
  const playingDef = currentId ? INSTRUMENTS[currentId] : null

  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <Splash onBegin={() => setScreen('scan')} />

      case 'scan':
        return <Scanner onCapture={handleCapture} onBrowse={() => setScreen('picker')} />

      case 'analyzing':
        return <Analyzing photo={photo} />

      case 'result':
        if (resultDef && ident) {
          return (
            <ResultReveal
              photo={photo}
              ident={ident}
              def={resultDef}
              onPlay={() => playInstrument(ident.id, 'scan')}
              onRescan={() => setScreen('scan')}
            />
          )
        }
        return <Scanner onCapture={handleCapture} onBrowse={() => setScreen('picker')} />

      case 'play':
        if (playingDef) {
          return <PlayerScreen def={playingDef} onBack={() => setScreen(playBack)} />
        }
        return <InstrumentPicker onPick={(id) => playInstrument(id, 'picker')} onBack={() => setScreen('scan')} />

      case 'picker':
        return <InstrumentPicker onPick={(id) => playInstrument(id, 'picker')} onBack={() => setScreen('scan')} />

      case 'error':
        return (
          <ErrorState
            kind={errKind}
            detail={errDetail}
            onRetry={() => setScreen('scan')}
            onBrowse={() => setScreen('picker')}
          />
        )
    }
  }

  return (
    <div className="app">
      {/* key forces the entrance animation to replay on every screen change */}
      <div key={screen} style={{ position: 'absolute', inset: 0 }}>
        {renderScreen()}
      </div>
    </div>
  )
}
