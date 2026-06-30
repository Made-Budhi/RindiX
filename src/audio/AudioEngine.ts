// ── RindiX audio engine ──────────────────────────────────────────────
// A tiny mixing desk: every tap routes through a per-note bus into a master
// compressor, with a copy sent to a generated "temple hall" reverb so the
// bronze blooms the way it does in a Balinese pavilion.

import type { PadSpec } from '../types'
import { bamboo, bronze, cymbal, drum, gong } from './voices'

type VoiceFn = (ctx: BaseAudioContext, bus: AudioNode, pad: PadSpec, vel: number) => void

const VOICES: Record<PadSpec['voice'], VoiceFn> = {
  bronze,
  bamboo,
  gong,
  cymbal,
  drum,
}

class AudioEngineImpl {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private wetIn: ConvolverNode | null = null
  private sampleCache = new Map<string, AudioBuffer>()
  private loadStarted = new Set<string>()

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
