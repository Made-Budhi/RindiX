// ── RindiX audio engine ──────────────────────────────────────────────
// A tiny mixing desk: every tap routes through a per-note bus into a master
// compressor, with a copy sent to a generated "temple hall" reverb so the
// bronze blooms the way it does in a Balinese pavilion.

import type { PadSpec } from '../types'
import { bamboo, bronze, cymbal, drum, gong, noiseBuffer } from './voices'

type VoiceFn = (ctx: BaseAudioContext, bus: AudioNode, pad: PadSpec, vel: number) => void

const VOICES: Record<PadSpec['voice'], VoiceFn> = {
  bronze,
  bamboo,
  gong,
  cymbal,
  drum,
  // The suling is a sustained, breath-driven voice handled by the flute*()
  // methods below, not the one-shot strike path — so this is a no-op.
  flute: () => {},
}

/** The persistent node graph of the sustained flute voice. */
interface FluteNodes {
  out: GainNode
  send: GainNode
  lp: BiquadFilterNode
  osc1: OscillatorNode
  osc2: OscillatorNode
  osc3: OscillatorNode
  noise: AudioBufferSourceNode
  ng: GainNode
  vib: OscillatorNode
}

class AudioEngineImpl {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private wetIn: ConvolverNode | null = null
  private sampleCache = new Map<string, AudioBuffer>()
  private loadStarted = new Set<string>()
  private flute: FluteNodes | null = null

  /** Lazily create the audio graph. Must be triggered by a user gesture. */
  private ensure(): AudioContext {
    if (this.ctx) return this.ctx
    const Ctor: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctor()

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -16
    compressor.knee.value = 22
    compressor.ratio.value = 3.2
    compressor.attack.value = 0.003
    compressor.release.value = 0.25
    compressor.connect(ctx.destination)

    const master = ctx.createGain()
    master.gain.value = 0.85
    master.connect(compressor)

    // temple-hall reverb
    const convolver = ctx.createConvolver()
    convolver.buffer = makeImpulse(ctx, 1.7, 2.6)
    const wet = ctx.createGain()
    wet.gain.value = 0.22
    convolver.connect(wet).connect(compressor)

    this.ctx = ctx
    this.master = master
    this.wetIn = convolver
    return ctx
  }

  /** Resume the context (call on first interaction so mobile audio unlocks). */
  async unlock(): Promise<void> {
    const ctx = this.ensure()
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        /* ignored — will retry on next gesture */
      }
    }
  }

  get ready(): boolean {
    return !!this.ctx && this.ctx.state === 'running'
  }

  /** Strike a pad. Creates a fresh wet/dry bus per note for clean overlap.
   *  Plays the real recorded sample when it is loaded, else synthesises — so a
   *  tap is never silent, even before the samples finish downloading. */
  play(pad: PadSpec, velocity = 1): void {
    const ctx = this.ensure()
    if (ctx.state === 'suspended') void ctx.resume()
    if (!this.master || !this.wetIn) return

    const buf = pad.sampleUrl ? this.sampleCache.get(pad.sampleUrl) : undefined

    const bus = ctx.createGain()
    bus.gain.value = 1
    bus.connect(this.master)
    const send = ctx.createGain()
    // Recordings already carry their own room and decay, so feed the reverb
    // gently; synthesised voices want more bloom.
    send.gain.value = buf ? 0.3 : 0.85
    bus.connect(send).connect(this.wetIn)

    let life: number
    if (buf) {
      const rate = pad.sampleRate ?? 1
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.playbackRate.value = rate
      const g = ctx.createGain()
      g.gain.value = velocity
      src.connect(g).connect(bus)
      src.start()
      src.onended = () => g.disconnect()
      life = buf.duration / rate + 0.5
    } else {
      VOICES[pad.voice](ctx, bus, pad, velocity)
      life = (pad.decay ?? 2) + 2.5
    }

    window.setTimeout(() => {
      bus.disconnect()
      send.disconnect()
    }, life * 1000)
  }

  /** Fetch + decode the given sample URLs ahead of time for zero-latency
   *  playback. Idempotent — safe to call per instrument screen. */
  async preloadSamples(urls: Array<string | undefined>): Promise<void> {
    const ctx = this.ensure()
    await Promise.all(
      urls
        .filter((u): u is string => !!u)
        .map(async (url) => {
          if (this.sampleCache.has(url) || this.loadStarted.has(url)) return
          this.loadStarted.add(url)
          try {
            const res = await fetch(url)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const buf = await ctx.decodeAudioData(await res.arrayBuffer())
            this.sampleCache.set(url, buf)
          } catch (e) {
            this.loadStarted.delete(url) // permit a later retry
            console.warn('[RindiX] sample failed to load, falling back to synthesis:', url, e)
          }
        }),
    )
  }

  /** The shared AudioContext (created on demand). Used by the mic analyser. */
  get context(): AudioContext {
    return this.ensure()
  }

  // ── Sustained flute (suling) ───────────────────────────────────────
  // A single always-on voice whose gain follows the player's breath and
  // whose pitch glides as the fingering changes.

  /** Build the flute graph once; silent until breath arrives. */
  fluteEnsure(): void {
    const ctx = this.ensure()
    if (ctx.state === 'suspended') void ctx.resume()
    if (this.flute || !this.master || !this.wetIn) return
    const t = ctx.currentTime

    const out = ctx.createGain()
    out.gain.value = 0
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 5200
    lp.Q.value = 0.5
    out.connect(lp)
    lp.connect(this.master)
    const send = ctx.createGain()
    send.gain.value = 0.5 // a touch more reverb than the bronze
    lp.connect(send).connect(this.wetIn)

    const tone = (type: OscillatorType, mul: number, g: number) => {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.value = 440 * mul
      const gain = ctx.createGain()
      gain.gain.value = g
      o.connect(gain).connect(out)
      o.start(t)
      return o
    }
    const osc1 = tone('sine', 1, 1.0)
    const osc2 = tone('sine', 2, 0.14)
    const osc3 = tone('triangle', 3, 0.05)

    // breath noise — the airy bamboo "shhh"
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer(ctx)
    noise.loop = true
    const nbp = ctx.createBiquadFilter()
    nbp.type = 'bandpass'
    nbp.frequency.value = 2600
    nbp.Q.value = 0.5
    const ng = ctx.createGain()
    ng.gain.value = 0
    noise.connect(nbp).connect(ng).connect(out)
    noise.start(t)

    // gentle vibrato
    const vib = ctx.createOscillator()
    vib.type = 'sine'
    vib.frequency.value = 5.6
    const vibg = ctx.createGain()
    vibg.gain.value = 7 // cents
    vib.connect(vibg)
    vibg.connect(osc1.detune)
    vibg.connect(osc2.detune)
    vibg.connect(osc3.detune)
    vib.start(t)

    this.flute = { out, send, lp, osc1, osc2, osc3, noise, ng, vib }
  }

  /** Glide the flute to a new pitch. */
  fluteFreq(freq: number): void {
    const f = this.flute
    if (!f || !this.ctx) return
    const t = this.ctx.currentTime
    f.osc1.frequency.setTargetAtTime(freq, t, 0.05)
    f.osc2.frequency.setTargetAtTime(freq * 2, t, 0.05)
    f.osc3.frequency.setTargetAtTime(freq * 3, t, 0.05)
  }

  /** Set breath strength (0 = silent, 1 = full). Drives volume + air noise. */
  fluteBreath(intensity: number): void {
    const f = this.flute
    if (!f || !this.ctx) return
    const x = Math.max(0, Math.min(1, intensity))
    const t = this.ctx.currentTime
    f.out.gain.setTargetAtTime(x * 0.42, t, 0.05)
    f.ng.gain.setTargetAtTime(x * 0.1, t, 0.06)
  }

  /** Stop and discard the flute graph (on leaving the suling screen). */
  fluteDispose(): void {
    const f = this.flute
    if (!f) return
    try {
      f.osc1.stop()
      f.osc2.stop()
      f.osc3.stop()
      f.noise.stop()
      f.vib.stop()
    } catch {
      /* already stopped */
    }
    f.out.disconnect()
    f.send.disconnect()
    f.lp.disconnect()
    this.flute = null
  }
}

/** Generate a decaying-noise impulse response for the convolver reverb. */
function makeImpulse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = ctx.sampleRate
  const len = Math.floor(seconds * rate)
  const impulse = ctx.createBuffer(2, len, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
  }
  return impulse
}

/** Singleton — one audio graph for the whole app. */
export const audioEngine = new AudioEngineImpl()
