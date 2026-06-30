// ── Google Gemini Vision integration ─────────────────────────────────
// Two calls power the experience:
//   identifyInstrument() — vision: which instrument is in this photo?
//   generateTrivia()     — text:  fresh cultural facts to "Learn" from.
// Both fail soft: no key or a network hiccup never breaks the demo, the app
// just falls back to its curated manifest knowledge.

import { INSTRUMENTS, matchInstrument } from '../data/instruments'
import type { Identification, InstrumentId } from '../types'

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY ?? '').trim()
// NOTE: gemini-1.5-flash was retired by Google (returns 404). Default to a
// current Flash model; override with VITE_GEMINI_MODEL if you like.
const MODEL = (import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash').trim()
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`

const VALID_IDS = Object.keys(INSTRUMENTS) as InstrumentId[]

/**
 * Minimum confidence (0–1) required to accept an identification.
 * Below this, the app shows "Unable to identify an instrument" instead of a
 * shaky guess. Tune this single value to taste.
 */
export const MIN_CONFIDENCE = 0.5

export function isConfigured(): boolean {
  return API_KEY.length > 12
}

/** Split a `data:image/...;base64,xxxx` URL into its mime type and payload. */
function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl)
  if (!match) return { mimeType: 'image/jpeg', data: dataUrl }
  return { mimeType: match[1], data: match[2] }
}

async function callGemini(body: unknown): Promise<string> {
  const res = await fetch(ENDPOINT(MODEL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    let msg = raw.slice(0, 200)
    try {
      msg = JSON.parse(raw)?.error?.message ?? msg
    } catch {
      /* keep raw slice */
    }
    if (res.status === 429) throw new Error('RATE_LIMIT')
    if (res.status === 404) throw new Error(`Model "${MODEL}" not found — set VITE_GEMINI_MODEL to a current model.`)
    throw new Error(`Gemini ${res.status}: ${msg}`.slice(0, 180))
  }
  const json = await res.json()
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned an empty response.')
  return text
}

/** Ask Gemini Vision to name the instrument in a captured photo. */
export async function identifyInstrument(imageDataUrl: string): Promise<Identification> {
  if (!isConfigured()) {
    throw new Error('NO_API_KEY')
  }

  const { mimeType, data } = splitDataUrl(imageDataUrl)
  const prompt = [
    'You verify whether a photo CLEARLY shows ONE of exactly seven Balinese gamelan instruments.',
    'Be rigorous and skeptical. It is far better to answer "none" than to guess.',
    '',
    'The seven instruments and their tell-tale features:',
    '- gangsa: a row of bronze bars suspended over a carved wooden frame with bamboo resonators.',
    '- reyong: a long horizontal row of small bronze kettle-gongs (raised bosses) on a frame.',
    '- gong: a single large hanging bronze gong with a central raised boss.',
    '- kempur: a single medium hanging bronze gong, smaller than the great gong.',
    '- cengceng: small bronze cymbals, often mounted in a row.',
    '- kendang: a two-headed wooden barrel hand-drum.',
    '- rindik: a xylophone of tuned bamboo tubes.',
    '',
    'Fill the JSON fields IN THIS ORDER:',
    '1. seen: describe literally and objectively what is actually visible (objects, shapes, colours,',
    '   lighting). Do NOT name an instrument here. If the frame is black, blank, dark, blurry, a screen,',
    '   a person, or shows something unrelated, say so plainly.',
    '2. isInstrument: true ONLY if one of the seven is clearly visible WITH its identifying features.',
    '3. id: the matching id — but if isInstrument is false, or the image is blank/black/too dark/blurry,',
    '   or shows anything that is not clearly one of the seven, set id to "none".',
    '4. confidence: 0 to 1, honestly calibrated. Only exceed 0.7 when the features are unmistakable.',
    '   Use 0 with id "none" whenever you cannot clearly see one of the seven instruments.',
    '5. observation: one vivid sentence about THIS photo (or why nothing could be identified).',
    '',
    'Never invent an instrument just to provide an answer.',
  ].join('\n')

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data } }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          seen: { type: 'string' },
          isInstrument: { type: 'boolean' },
          id: { type: 'string', enum: [...VALID_IDS, 'none'] },
          confidence: { type: 'number' },
          observation: { type: 'string' },
        },
        required: ['seen', 'isInstrument', 'id', 'confidence', 'observation'],
        // Force the model to describe the image BEFORE committing to an id.
        propertyOrdering: ['seen', 'isInstrument', 'id', 'confidence', 'observation'],
      },
    },
  }

  const text = await callGemini(body)
  const parsed = JSON.parse(text) as {
    seen?: string
    isInstrument?: boolean
    id: string
    confidence: number
    observation?: string
  }

  const guess =
    parsed.id === 'none'
      ? null
      : matchInstrument(parsed.id) ?? (VALID_IDS.includes(parsed.id as InstrumentId) ? (parsed.id as InstrumentId) : null)
  const rejected = !guess || parsed.isInstrument === false

  // Honour the model's number exactly — do NOT coerce a real 0 into 0.5.
  const raw = Number(parsed.confidence)
  const confidence = rejected ? 0 : Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 0

  // A valid id is required by the return type; when rejected it is never shown
  // (confidence 0 falls below the threshold), so any placeholder is fine.
  const id: InstrumentId = guess ?? 'gangsa'

  return {
    id,
    confidence,
    observation:
      parsed.observation?.trim() || (rejected ? 'No clear gamelan instrument was visible.' : INSTRUMENTS[id].tagline),
  }
}

/** Ask Gemini for a few fresh trivia lines. Returns null on any failure. */
export async function generateTrivia(id: InstrumentId): Promise<string[] | null> {
  if (!isConfigured()) return null
  const def = INSTRUMENTS[id]
  const prompt = [
    `Share 3 short, vivid, museum-quality facts about the Balinese "${def.name}" (${def.subtitle}).`,
    'Each fact: one sentence, warm and wonder-filled, historically accurate, no repetition.',
    'Avoid starting every fact the same way. Return JSON: an array of 3 strings.',
  ].join('\n')

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.85,
      responseMimeType: 'application/json',
      responseSchema: { type: 'array', items: { type: 'string' } },
    },
  }

  try {
    const text = await callGemini(body)
    const arr = JSON.parse(text)
    if (Array.isArray(arr) && arr.every((x) => typeof x === 'string') && arr.length) {
      return arr.slice(0, 4)
    }
    return null
  } catch {
    return null
  }
}
