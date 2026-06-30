// ── Synthesised gamelan voices ───────────────────────────────────────
// Every instrument's tone is built live with the Web Audio API. No audio
// files, no loading, zero latency — and tuned to ring like real bronze and
// bamboo. Each voice routes into a per-note "bus" supplied by the engine
// (which sends a copy to a temple-hall reverb).

import type { PadSpec } from '../types'

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>()

/** A reusable 2-second white-noise buffer (one per context). */
export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const cached = noiseCache.get(ctx)
  if (cached) return cached
  const len = Math.floor(ctx.sampleRate * 2)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  noiseCache.set(ctx, buf)
  return buf
}

/** Attack → exponential-decay envelope. */
function adsr(
  param: AudioParam,
  t: number,
  peak: number,
  attack: number,
  decay: number,
  floor = 0.0006,
) {
  param.cancelScheduledValues(t)
  param.setValueAtTime(0.0001, t)
  param.linearRampToValueAtTime(peak, t + attack)
  param.exponentialRampToValueAtTime(floor, t + attack + decay)
}

/** Short filtered-noise transient — the mallet/stick contact. */
function transient(
  ctx: BaseAudioContext,
  dest: AudioNode,
  t: number,
  freq: number,
  dur: number,
  amp: number,
  type: BiquadFilterType = 'bandpass',
) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  src.playbackRate.value = 0.85 + Math.random() * 0.3
  const filt = ctx.createBiquadFilter()
  filt.type = type
  filt.frequency.value = freq
  filt.Q.value = 0.7
  const g = ctx.createGain()
  adsr(g.gain, t, amp, 0.001, dur)
  src.connect(filt).connect(g).connect(dest)
  src.start(t)
  src.stop(t + dur + 0.05)
  src.onended = () => {
    filt.disconnect()
    g.disconnect()
  }
}

interface Partial {
  r: number
  g: number
  type: OscillatorType
}

/** Stack of detuned partials sharing one filter+envelope — the bronze/bamboo core. */
function struckTone(
  ctx: BaseAudioContext,
  bus: AudioNode,
  opts: {
    freq: number
    decay: number
    shimmer: number
    peak: number
    attack: number
    partials: Partial[]
    filterFrom: number
    filterTo: number
    q?: number
  },
) {
  const t = ctx.currentTime
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = opts.q ?? 0.8
  filter.frequency.setValueAtTime(opts.filterFrom, t)
  filter.frequency.exponentialRampToValueAtTime(Math.max(opts.filterTo, 200), t + opts.decay)

  const env = ctx.createGain()
  adsr(env.gain, t, opts.peak, opts.attack, opts.decay)
  filter.connect(env).connect(bus)

  const oscs: OscillatorNode[] = []
  for (const dt of [-opts.shimmer / 2, opts.shimmer / 2]) {
    for (const p of opts.partials) {
      const o = ctx.createOscillator()
      o.type = p.type
      o.frequency.value = opts.freq * p.r
      o.detune.value = dt
      const g = ctx.createGain()
      g.gain.value = p.g
      o.connect(g).connect(filter)
      o.start(t)
      o.stop(t + opts.decay + 0.12)
      oscs.push(o)
    }
  }
  const last = oscs[oscs.length - 1]
  last.onended = () => {
    filter.disconnect()
    env.disconnect()
  }
}

// ── Public voices ────────────────────────────────────────────────────

export function bronze(ctx: BaseAudioContext, bus: AudioNode, pad: PadSpec, vel: number) {
  const freq = pad.freq ?? 300
  struckTone(ctx, bus, {
    freq,
    decay: pad.decay ?? 1.6,
    shimmer: pad.shimmer ?? 8,
    peak: 0.5 * vel,
    attack: 0.003,
    filterFrom: freq * 9,
    filterTo: freq * 2.6,
    partials: [
      { r: 1, g: 1.0, type: 'triangle' },
      { r: 2.01, g: 0.5, type: 'sine' },
      { r: 2.76, g: 0.22, type: 'sine' },
      { r: 5.4, g: 0.12, type: 'sine' },
    ],
  })
  transient(ctx, bus, ctx.currentTime, freq * 4, 0.006, 0.05 * vel)
}

export function bamboo(ctx: BaseAudioContext, bus: AudioNode, pad: PadSpec, vel: number) {
  const freq = pad.freq ?? 360
  struckTone(ctx, bus, {
    freq,
    decay: pad.decay ?? 0.8,
    shimmer: pad.shimmer ?? 4,
    peak: 0.52 * vel,
    attack: 0.002,
    filterFrom: freq * 6,
    filterTo: freq * 2,
    q: 0.6,
    partials: [
      { r: 1, g: 1.0, type: 'triangle' },
      { r: 2, g: 0.36, type: 'sine' },
      { r: 3, g: 0.15, type: 'sine' },
      { r: 4.2, g: 0.06, type: 'sine' },
    ],
  })
  // hollow bamboo "tok"
  transient(ctx, bus, ctx.currentTime, 1900, 0.02, 0.16 * vel)
}

export function gong(ctx: BaseAudioContext, bus: AudioNode, pad: PadSpec, vel: number) {
  const freq = pad.freq ?? 84
  const decay = pad.decay ?? 7
  const shimmer = pad.shimmer ?? 20
  const t = ctx.currentTime

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(freq * 8, t)
  filter.frequency.exponentialRampToValueAtTime(freq * 3, t + decay)
  filter.Q.value = 0.7

  const env = ctx.createGain()
  adsr(env.gain, t, 0.62 * vel, 0.02, decay)
  filter.connect(env).connect(bus)

  // slow shimmer (the gong's hypnotic "wow")
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 2.7
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.045
  lfo.connect(lfoGain).connect(env.gain)
  lfo.start(t)
  lfo.stop(t + decay + 0.2)

  const partials: Partial[] = [
    { r: 1, g: 1.0, type: 'sine' },
    { r: 2.0, g: 0.6, type: 'sine' },
    { r: 2.73, g: 0.4, type: 'sine' },
    { r: 3.45, g: 0.26, type: 'sine' },
    { r: 4.6, g: 0.16, type: 'sine' },
    { r: 5.9, g: 0.1, type: 'sine' },
  ]
  const oscs: OscillatorNode[] = []
  for (const dt of [-shimmer / 2, shimmer / 2]) {
    for (const p of partials) {
      const o = ctx.createOscillator()
      o.type = p.type
      const target = freq * p.r
      o.frequency.setValueAtTime(target * 1.012, t)
      o.frequency.exponentialRampToValueAtTime(target, t + 0.5)
      o.detune.value = dt
      const g = ctx.createGain()
      g.gain.value = p.g
      o.connect(g).connect(filter)
      o.start(t)
      o.stop(t + decay + 0.2)
      oscs.push(o)
    }
  }
  transient(ctx, bus, t, freq * 6, 0.05, 0.08 * vel)
  oscs[oscs.length - 1].onended = () => {
    filter.disconnect()
    env.disconnect()
    lfoGain.disconnect()
  }
}

export function cymbal(ctx: BaseAudioContext, bus: AudioNode, pad: PadSpec, vel: number) {
  const variant = pad.variant ?? 'crash'
  const decay = pad.decay ?? (variant === 'chick' ? 0.16 : variant === 'ring' ? 0.8 : 1.2)
  const hp = variant === 'chick' ? 6000 : variant === 'ring' ? 4200 : 2800
  const t = ctx.currentTime

  const env = ctx.createGain()
  adsr(env.gain, t, 0.5 * vel, 0.001, decay)
  env.connect(bus)

  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  src.loop = true
  src.playbackRate.value = 0.8 + Math.random() * 0.5

  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = hp
  const broad = ctx.createGain()
  broad.gain.value = 0.7
  src.connect(highpass).connect(broad).connect(env)

  // metallic resonant peaks
  for (const f of [3200, 5400, 8200]) {
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = f * (0.9 + Math.random() * 0.2)
    bp.Q.value = 7
    const g = ctx.createGain()
    g.gain.value = 0.5
    src.connect(bp).connect(g).connect(env)
  }

  src.start(t)
  src.stop(t + decay + 0.1)
  src.onended = () => {
    env.disconnect()
  }
}

export function drum(ctx: BaseAudioContext, bus: AudioNode, pad: PadSpec, vel: number) {
  const variant = pad.variant ?? 'open'
  const freq = pad.freq ?? 120
  const decay = pad.decay ?? 0.5
  const t = ctx.currentTime

  // membrane body — pitched thump with a fast downward glide
  const o = ctx.createOscillator()
  o.type = variant === 'slap' ? 'triangle' : 'sine'
  const top = variant === 'low' ? freq * 1.9 : variant === 'slap' ? freq * 1.3 : freq * 1.55
  const glide = variant === 'low' ? 0.09 : 0.05
  o.frequency.setValueAtTime(top, t)
  o.frequency.exponentialRampToValueAtTime(freq, t + glide)

  const bodyGain = ctx.createGain()
  const bodyAmp = variant === 'slap' ? 0.4 : variant === 'muted' ? 0.55 : 0.95
  adsr(bodyGain.gain, t, bodyAmp * vel, 0.002, decay)
  o.connect(bodyGain).connect(bus)
  o.start(t)
  o.stop(t + decay + 0.1)
  o.onended = () => {
    bodyGain.disconnect()
  }

  // skin slap / attack noise
  const noiseAmp = variant === 'slap' ? 0.7 : variant === 'muted' ? 0.4 : variant === 'open' ? 0.3 : 0.22
  const noiseFreq = variant === 'slap' ? 2600 : 1300
  transient(ctx, bus, t, noiseFreq, decay * 0.45, noiseAmp * vel, 'bandpass')
}
