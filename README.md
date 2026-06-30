<div align="center">

# 🪘 RindiX · Interactive Gamelan Vision

**Snap a photo of a “do-not-touch” Balinese gamelan instrument — and play its living digital replica.**

*AI for Culture & Creative Heritage*

</div>

---

## The idea

Museum visitors can **look** at traditional instruments like the Balinese gamelan, but conservation rules mean they can never **touch or hear** them — the auditory, interactive soul of the heritage is lost behind glass.

**RindiX** gives it back. Point your phone at an instrument, and Gemini Vision recognises it instantly. The screen transforms into a multi-touch, zero-latency replica of that exact instrument — tuned to real Balinese scales — with an AI curator whispering its history beneath your fingers.

## How it works

1. **Scan & Snap** — open the web app (e.g. via a QR code at the exhibit) and photograph the instrument.
2. **AI Analysis** — the photo goes to **Google Gemini Vision**, which identifies the instrument (Gangsa, Reyong, Gong, Kempur, Ceng-Ceng, Kendang, or Rindik).
3. **Playable Transformation** — the UI becomes a digital replica of that instrument.
4. **Interact** — tap the bronze keys, kettles, gongs, cymbals or drum heads. Audio is **synthesised live with the Web Audio API** — no samples to load, no latency, full multi-touch.
5. **Learn** — a dynamic panel shows AI-generated cultural trivia about the instrument you’re holding.

## Quick start

```bash
# 1. install
npm install

# 2. add your Gemini key  (already scaffolded in .env)
#    get one free at https://aistudio.google.com/app/apikey
#    edit .env  →  VITE_GEMINI_API_KEY=your-key-here

# 3. run
npm run dev        # open the printed URL on your phone (same Wi-Fi) or desktop

# build for production
npm run build && npm run preview
```

> **No key yet? It still works.** Without a key (or if recognition fails) the app gracefully
> falls back to a **Browse the Collection** mode so you can play every instrument by hand, and
> the Learn panel uses curated heritage notes instead of live AI. Great for offline demos.

> 📷 **Camera tip:** browsers only allow the camera over `https://` or `localhost`. On a phone,
> use the dev server’s network URL with HTTPS, or just tap **Upload** / **Browse**.

## What makes it feel authentic

- **Real tunings.** Bronze instruments use an uneven **pélog selisir** scale; the Rindik uses **sléndro** — not equal temperament. Tones are generated from cents, the way a real gamelan is tuned by ear.
- **The shimmer (*ombak*).** Each bronze strike is two voices detuned a few cents apart, recreating the paired-tuning “wave” that makes Balinese metal sound alive.
- **A temple-hall reverb** built from a generated impulse response, so the bronze blooms.
- **Per-instrument synthesis** — inharmonic bronze partials, hollow bamboo, swelling gongs with a slow beating “wow”, crackling cymbals, and membrane drums with pitch-glide thumps.

## Tech stack

| Layer    | Choice |
|----------|--------|
| Frontend | **React + TypeScript** (Vite), mobile-first PWA |
| AI       | **Google Gemini** (`gemini-1.5-flash`) — vision recognition **and** live trivia, dataset-free |
| Audio    | **Web Audio API** — real recorded samples (decoded up front), with live-synthesis fallback, zero-latency multi-touch |
| Data     | A single hardcoded **JSON asset manifest** mapping instrument → tuning, layout, audio recipe & culture |

## Project structure

```
src/
├─ App.tsx                 # screen state-machine (splash → scan → analyze → result → play)
├─ data/instruments.ts     # the asset manifest: tunings, layouts, trivia, aliases
├─ services/gemini.ts      # Gemini Vision identify() + generateTrivia(), fail-soft
├─ audio/
│  ├─ AudioEngine.ts       # master bus, compressor, temple-hall reverb, per-note routing
│  └─ voices.ts            # bronze · bamboo · gong · cymbal · drum synthesis
├─ hooks/useCamera.ts      # camera capture + file-upload fallback
└─ components/
   ├─ Splash · Scanner · Analyzing · ResultReveal · ErrorState · InstrumentPicker
   ├─ TriviaPanel.tsx      # the "Learn" panel (AI + curated)
   ├─ ornaments.tsx        # Balinese SVG filigree, batik, lotus, logo, glyphs
   └─ players/index.tsx    # the 5 playable layouts (bars · reyong · gong · cengceng · kendang)
```

## The instruments

| Instrument | Family | Scale | Plays |
|-----------|--------|-------|-------|
| **Gangsa** | Bronze metallophone | pélog | 7 tuned bars |
| **Reyong** | Bronze gong-chime row | pélog | 12 bossed kettles |
| **Rindik** | Bamboo xylophone | sléndro | 11 bamboo bars |
| **Gong Ageng** | Great hanging gong | — | the deep cycle-ending boom |
| **Kempur** | Mid punctuating gong | — | phrase-marking strokes |
| **Ceng-Ceng** | Cymbals | — | crash + interlocking *kecek* |
| **Kendang** | Leading drum pair | — | Wadon & Lanang, 4 strokes |

## Real instrument recordings

RindiX plays **real recorded samples** of each instrument, served from
[`public/samples/`](public/samples) and decoded up front for zero-latency, multi-touch play.
Synthesis stays as an automatic fallback — if a sample is still downloading or fails to load, a
tap is never silent.

How the samples map:
- **Gangsa** — seven individual note recordings (`gangsa/1.wav … 7.wav`), one per bar.
- **Gong · Kempur · Ceng-Ceng · Kendang** — a single recording each; the kendang's four strokes
  and the ceng-ceng's kecek are pitch-shifted from one hit for variety.
- **Reyong · Rindik** — one recording each, pitch-mapped across all kettles/bars (relative to the
  lowest note) so you can still play a melody in the instrument's real timbre.

To swap or retune, edit the `sampleUrl` / `sampleRate` on any pad in
[`src/data/instruments.ts`](src/data/instruments.ts) — no other code changes needed.

## Notes & next steps

- **API-key security.** This is a client-side prototype, so the key is bundled into the
  front-end — fine for a hackathon. For production, proxy the Gemini calls through a small
  serverless function so the key stays secret.
- **PWA.** Includes a web manifest + service worker, so it’s installable to a phone home screen.
- **Roadmap:** real curated samples per gamelan, a “play-along” backing loop, save/share a
  recording of what you played, multi-language trivia.

---

<div align="center">
<em>Made with respect for Balinese gamelan and the smiths, players and dancers who keep it alive.</em>
</div>
