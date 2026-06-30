// ── Core domain types for RindiX ─────────────────────────────────────

export type InstrumentId =
  | 'gangsa'
  | 'reyong'
  | 'gong'
  | 'kempur'
  | 'cengceng'
  | 'kendang'
  | 'rindik'

/** How the on-screen, playable replica is laid out & interacted with. */
export type LayoutKind = 'bars' | 'reyong' | 'gong' | 'cengceng' | 'kendang'

/** Which synthesis voice the audio engine uses for a pad. */
export type VoiceKind = 'bronze' | 'bamboo' | 'gong' | 'cymbal' | 'drum'

/** A single tappable surface on an instrument (a key, kettle, drum head…). */
export interface PadSpec {
  id: string
  /** Solfège or label shown on the pad (ding, dong, deng, dung, dang…). */
  label?: string
  /** Fundamental pitch in Hz for tuned voices. */
  freq?: number
  /** Sub-type for un-pitched voices, e.g. drum stroke 'dug' | 'tak'. */
  variant?: string
  voice: VoiceKind
  /** Seconds of natural decay; overrides the voice default when present. */
  decay?: number
  /** Detune in cents for the paired-tuning shimmer (ngumbang–ngisep). */
  shimmer?: number
  /** Optional real sample to play instead of synthesising (manifest-ready). */
  sampleUrl?: string
  /** Playback-rate multiplier for the sample (pitch-shift; 1 = original). */
  sampleRate?: number
  /** Visual size weight within the layout (1 = standard). */
  span?: number
  color?: string
}

/** The full description of one instrument — the JSON asset manifest entry. */
export interface InstrumentDef {
  id: InstrumentId
  name: string
  /** e.g. "Bronze Metallophone". */
  subtitle: string
  /** Indonesian/Balinese pronunciation hint. */
  pronunciation: string
  scale: 'pelog' | 'slendro' | 'unpitched'
  layout: LayoutKind
  /** Theme accent colour used across this instrument's screen. */
  accent: string
  /** Short evocative one-liner shown on the reveal. */
  tagline: string
  /** Intro paragraph describing the instrument. */
  story: string
  /** Curated cultural facts (reliable fallback for the AI trivia panel). */
  trivia: string[]
  /** Alternate names the vision model might return. */
  aliases: string[]
  pads: PadSpec[]
}

/** Result of asking Gemini Vision to recognise a photographed instrument. */
export interface Identification {
  id: InstrumentId
  /** 0–1 confidence reported by the model. */
  confidence: number
  /** One-line live observation about the specific photo. */
  observation: string
  /** True when produced without a live API call (graceful fallback). */
  offline?: boolean
}

/** Top-level screens of the experience. */
export type Screen =
  | 'splash'
  | 'scan'
  | 'analyzing'
  | 'result'
  | 'play'
  | 'picker'
  | 'error'
