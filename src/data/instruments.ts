import type { InstrumentDef, InstrumentId, PadSpec } from '../types'

// ── Balinese tuning helpers ──────────────────────────────────────────
// Balinese gamelan is NOT tuned to equal temperament. We approximate two
// classical scales with uneven steps (in cents) so the replicas ring true.

const centsToRatio = (cents: number) => Math.pow(2, cents / 1200)

/** Pelog selisir — the bright 5-tone scale of gong kebyar. */
const PELOG_CENTS = [0, 130, 365, 640, 850]
const PELOG_OCTAVE = 1235 // octaves are slightly "stretched"

/** Slendro — five near-equidistant tones, home of the rindik. */
const SLENDRO_CENTS = [0, 231, 474, 717, 955]
const SLENDRO_OCTAVE = 1208

/** Balinese solfège: ding · dong · deng · dung · dang. */
const SOLFEGE = ['ding', 'dong', 'deng', 'dung', 'dang']

interface Tone {
  freq: number
  label: string
}

function buildScale(
  baseDing: number,
  cents: number[],
  octaveCents: number,
  count: number,
): Tone[] {
  const tones: Tone[] = []
  for (let i = 0; i < count; i++) {
    const octave = Math.floor(i / 5)
    const step = i % 5
    const totalCents = cents[step] + octave * octaveCents
    tones.push({
      freq: Math.round(baseDing * centsToRatio(totalCents) * 10) / 10,
      label: SOLFEGE[step],
    })
  }
  return tones
}

const pelog = (baseDing: number, count: number) =>
  buildScale(baseDing, PELOG_CENTS, PELOG_OCTAVE, count)

const slendro = (baseDing: number, count: number) =>
  buildScale(baseDing, SLENDRO_CENTS, SLENDRO_OCTAVE, count)

// ── Pad builders ─────────────────────────────────────────────────────

function tonalPads(
  prefix: string,
  tones: Tone[],
  opts: { voice: PadSpec['voice']; decay: number; shimmer: number },
): PadSpec[] {
  return tones.map((t, i) => ({
    id: `${prefix}-${i}`,
    label: t.label,
    freq: t.freq,
    voice: opts.voice,
    decay: opts.decay,
    shimmer: opts.shimmer,
  }))
}

/** One recorded file per pad (e.g. Gangsa: /samples/gangsa/1.wav … 7.wav). */
function perNoteSamples(pads: PadSpec[], dir: string): PadSpec[] {
  return pads.map((p, i) => ({ ...p, sampleUrl: `${dir}/${i + 1}.wav`, sampleRate: 1 }))
}

/** A single recording shared across tuned pads, pitch-shifted to each pad's
 *  frequency (relative to the lowest pad). Keeps the real timbre while staying
 *  playable as a melody. */
function pitchedSample(pads: PadSpec[], url: string): PadSpec[] {
  const base = pads[0]?.freq ?? 1
  return pads.map((p) => ({ ...p, sampleUrl: url, sampleRate: p.freq ? p.freq / base : 1 }))
}

// ── The asset manifest ───────────────────────────────────────────────
// One entry per instrument: tuning + on-screen layout + audio recipe +
// the cultural knowledge that powers the "Learn" panel.

export const INSTRUMENTS: Record<InstrumentId, InstrumentDef> = {
  gangsa: {
    id: 'gangsa',
    name: 'Gangsa',
    subtitle: 'Bronze Metallophone',
    pronunciation: 'GANG-sah',
    scale: 'pelog',
    layout: 'bars',
    accent: '#d8a73e',
    tagline: 'The shimmering voice of the gong kebyar.',
    story:
      'The gangsa is a bronze metallophone whose forged keys float above tuned bamboo resonators. Players strike with a wooden mallet while the other hand dampens each key, weaving the lightning-fast interlocking figuration known as kotekan.',
    trivia: [
      'Gangsa are tuned in male–female pairs that are deliberately a few cents apart. The clash creates the shimmering “ombak” (wave) that makes Balinese bronze sound alive.',
      'Two players share one melody: polos (the on-beat) and sangsih (the off-beat) interlock so fast it sounds like a single impossible musician.',
      'Each bronze key hovers over a bamboo tube cut to its exact pitch, acting as a natural amplifier — an ancient resonator engineered entirely by ear.',
      'The free hand is as busy as the striking hand: it pinches each key silent the instant the next is struck, carving rhythm out of silence.',
    ],
    aliases: ['gangsa', 'metallophone', 'gendér', 'gender', 'gangsa pemade', 'kantilan', 'saron'],
    pads: perNoteSamples(
      tonalPads('gangsa', pelog(300, 7), { voice: 'bronze', decay: 1.7, shimmer: 9 }),
      '/samples/gangsa',
    ),
  },

  reyong: {
    id: 'reyong',
    name: 'Reyong',
    subtitle: 'Bronze Gong-Chime Row',
    pronunciation: 'RAY-ong',
    scale: 'pelog',
    layout: 'reyong',
    accent: '#c98233',
    tagline: 'One instrument, four pairs of hands.',
    story:
      'The reyong is a long row of small bossed gongs resting on a carved wooden frame. Four players sit shoulder to shoulder and share the single instrument, their interlocking parts braiding into dazzling cascades of melody.',
    trivia: [
      'A single reyong is played by four musicians at once — each covers a few kettles and their parts interlock into one continuous shimmering line.',
      'Strike the raised boss for a clear ringing tone, or the shoulder of the gong for the dry, percussive “byong” used in fierce kebyar passages.',
      'The four parts form two interlocking pairs, the same polos–sangsih logic that runs through the whole gamelan.',
      'Reyong figuration imitates birdsong and flowing water — Balinese music often paints the natural world in bronze.',
    ],
    aliases: ['reyong', 'reong', 'gong chime', 'gong-chime', 'kettle gong', 'bonang', 'trompong'],
    pads: pitchedSample(
      tonalPads('reyong', pelog(330, 12), { voice: 'bronze', decay: 1.3, shimmer: 6 }),
      '/samples/reyong.wav',
    ),
  },

  gong: {
    id: 'gong',
    name: 'Gong Ageng',
    subtitle: 'The Great Hanging Gong',
    pronunciation: 'gong ah-GUNG',
    scale: 'unpitched',
    layout: 'gong',
    accent: '#b23528',
    tagline: 'The deep breath that anchors the cosmos.',
    story:
      'The gong ageng is the largest and most sacred voice of the gamelan. Its vast bronze face is struck only at the close of each great musical cycle, and its slow, swelling tone is felt in the chest as much as heard.',
    trivia: [
      'The great gong sounds the end of every melodic cycle — it is the full stop of Balinese music, the moment the whole ensemble breathes out together.',
      'It is treated as sacred: many ensembles give the gong offerings and incense, and some are believed to house a guardian spirit.',
      'Listen for the slow “wow–wow” pulse after the strike — two close partials beating against each other create that hypnotic shimmer.',
      'Forged from bronze by master smiths (pande), a great gong can take weeks of hammering and tuning before its voice is born.',
    ],
    aliases: ['gong', 'gong ageng', 'gong gede', 'great gong', 'hanging gong', 'gong agung'],
    pads: [
      {
        id: 'gong-strike',
        label: 'Gong',
        freq: 84,
        voice: 'gong',
        decay: 7.5,
        shimmer: 22,
        sampleUrl: '/samples/gong.wav',
        sampleRate: 1,
      },
    ],
  },

  kempur: {
    id: 'kempur',
    name: 'Kempur',
    subtitle: 'The Midsize Punctuating Gong',
    pronunciation: 'kem-POOR',
    scale: 'unpitched',
    layout: 'gong',
    accent: '#c2603f',
    tagline: 'The phrase-keeper of the cycle.',
    story:
      'Smaller and higher than the great gong, the kempur hangs beside it and punctuates the music from within. Where the gong ageng marks the whole cycle, the kempur marks the phrases inside it — a signpost guiding the ensemble.',
    trivia: [
      'The kempur subdivides the long gong cycle, marking the inner phrases so the players always know where they are in the form.',
      'Its tone is brighter and shorter than the great gong — a clear punctuation mark rather than a final period.',
      'Together the gong, kempur and kempli form the “colotomic” skeleton: a clockwork of nested cycles that every other part hangs upon.',
      'In temple ceremonies its voice signals transitions between sections of a long ritual performance.',
    ],
    aliases: ['kempur', 'kempul', 'medium gong', 'punctuating gong'],
    pads: [
      {
        id: 'kempur-strike',
        label: 'Kempur',
        freq: 196,
        voice: 'gong',
        decay: 3.6,
        shimmer: 14,
        sampleUrl: '/samples/kempur.wav',
        sampleRate: 1,
      },
    ],
  },

  cengceng: {
    id: 'cengceng',
    name: 'Ceng-Ceng',
    subtitle: 'Cymbals of Fire',
    pronunciation: 'cheng-cheng',
    scale: 'unpitched',
    layout: 'cengceng',
    accent: '#cdb24a',
    tagline: 'Sparks of bronze over the storm.',
    story:
      'Ceng-ceng are small cymbals whose crackling bursts ignite the gamelan’s fastest passages. The mounted set, ceng-ceng ricik, often rests on a carved wooden turtle — a base shaped like the cosmic tortoise that holds up the world.',
    trivia: [
      'The mounted ricik set traditionally sits on a carved turtle (kekua) — the cosmic tortoise that Balinese myth says supports the world.',
      'Held cymbals are struck against fixed ones, and the bright crackle locks tightly to the kendang drum patterns.',
      'In the fierce baris and kebyar styles, ceng-ceng add the flashing “sparks” that make the music feel like fire.',
      'Their interlocking clatter is yet another layer of kotekan — even the cymbals talk to each other in interwoven rhythm.',
    ],
    aliases: ['ceng-ceng', 'cengceng', 'ceng ceng', 'cymbals', 'cymbal', 'rincik', 'ricik', 'kecek'],
    pads: [
      { id: 'cengceng-crash', label: 'Crash', voice: 'cymbal', variant: 'crash', decay: 1.3, span: 2, sampleUrl: '/samples/ceng.wav', sampleRate: 1 },
      { id: 'cengceng-kecek-0', label: 'Kecek', voice: 'cymbal', variant: 'chick', decay: 0.2, sampleUrl: '/samples/ceng.wav', sampleRate: 1.22 },
      { id: 'cengceng-kecek-1', label: 'Kecek', voice: 'cymbal', variant: 'chick', decay: 0.18, sampleUrl: '/samples/ceng.wav', sampleRate: 1.3 },
      { id: 'cengceng-kecek-2', label: 'Kecek', voice: 'cymbal', variant: 'chick', decay: 0.22, sampleUrl: '/samples/ceng.wav', sampleRate: 1.26 },
      { id: 'cengceng-ring', label: 'Ring', voice: 'cymbal', variant: 'ring', decay: 0.9, sampleUrl: '/samples/ceng.wav', sampleRate: 1.06 },
    ],
  },

  kendang: {
    id: 'kendang',
    name: 'Kendang',
    subtitle: 'The Drums That Lead',
    pronunciation: 'ken-DANG',
    scale: 'unpitched',
    layout: 'kendang',
    accent: '#8a4636',
    tagline: 'The heartbeat that conducts the ensemble.',
    story:
      'The kendang are two-headed hand drums that lead the entire gamelan — there is no conductor, only the drums. They are played as a pair: wadon (the lower “female” drum) and lanang (the higher “male” drum), whose strokes interlock to steer tempo and dynamics.',
    trivia: [
      'There is no conductor in a gamelan — the kendang lead. Their cues tell every musician when to speed up, swell, or stop.',
      'They come in pairs: wadon (female, lower) and lanang (male, higher). Apart they are incomplete; together they hold a conversation.',
      'A single drum speaks many syllables — “dug”, “tut”, “kum”, “tak” — depending on where and how the head is struck.',
      'Played with bare hands or a wooden beater (panggul), the two drums interlock their strokes into one seamless flowing pulse.',
    ],
    aliases: ['kendang', 'kendhang', 'kendang lanang', 'kendang wadon', 'drum', 'drums', 'hand drum'],
    pads: [
      // Order matters: [wadon-center, wadon-edge, lanang-center, lanang-edge]
      // One short drum recording, pitch-shifted to voice the four strokes.
      { id: 'wadon-dug', label: 'Dug', voice: 'drum', variant: 'low', freq: 92, decay: 0.9, sampleUrl: '/samples/kendang.wav', sampleRate: 0.82 },
      { id: 'wadon-kum', label: 'Kum', voice: 'drum', variant: 'muted', freq: 130, decay: 0.3, sampleUrl: '/samples/kendang.wav', sampleRate: 1.0 },
      { id: 'lanang-tut', label: 'Tut', voice: 'drum', variant: 'open', freq: 158, decay: 0.6, sampleUrl: '/samples/kendang.wav', sampleRate: 1.18 },
      { id: 'lanang-tak', label: 'Tak', voice: 'drum', variant: 'slap', freq: 260, decay: 0.22, sampleUrl: '/samples/kendang.wav', sampleRate: 1.5 },
    ],
  },

  rindik: {
    id: 'rindik',
    name: 'Rindik',
    subtitle: 'Bamboo Xylophone',
    pronunciation: 'RIN-dik',
    scale: 'slendro',
    layout: 'bars',
    accent: '#3f9279',
    tagline: 'The warm bamboo voice of Joged.',
    story:
      'The rindik is a xylophone of tuned bamboo tubes, lighter and warmer than its bronze cousins. Built on the five-tone slendro scale, it is the sweet, dancing heart of Joged Bumbung — the joyful Balinese social dance.',
    trivia: [
      'The rindik is tuned to slendro: five tones spaced almost evenly, giving it a floating, slightly hypnotic sweetness quite unlike the bronze instruments.',
      'It is the lead voice of Joged Bumbung, a flirtatious social dance where a solo dancer invites guests up to join her.',
      'Each bar is a length of seasoned bamboo, tuned by carefully shaving its ends — lighter and gentler than forged bronze.',
      'Rindik are usually played in pairs with interlocking parts, the same braided kotekan logic carried into bamboo.',
    ],
    aliases: ['rindik', 'tingklik', 'bamboo xylophone', 'bamboo', 'jegog', 'grantang', 'gambang'],
    pads: pitchedSample(
      tonalPads('rindik', slendro(360, 11), { voice: 'bamboo', decay: 0.85, shimmer: 4 }),
      '/samples/rindik.wav',
    ),
  },
}

export const INSTRUMENT_LIST: InstrumentDef[] = [
  INSTRUMENTS.gangsa,
  INSTRUMENTS.reyong,
  INSTRUMENTS.rindik,
  INSTRUMENTS.gong,
  INSTRUMENTS.kempur,
  INSTRUMENTS.cengceng,
  INSTRUMENTS.kendang,
]

/** Resolve a free-text label (e.g. from the vision model) to an instrument. */
export function matchInstrument(raw: string): InstrumentId | null {
  const q = raw.toLowerCase().trim()
  // direct id hit
  if ((q as InstrumentId) in INSTRUMENTS) return q as InstrumentId
  // alias / fuzzy contains
  for (const def of INSTRUMENT_LIST) {
    if (def.id === q || def.name.toLowerCase() === q) return def.id
    for (const alias of def.aliases) {
      if (q === alias || q.includes(alias) || alias.includes(q)) return def.id
    }
  }
  return null
}
