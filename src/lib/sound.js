// All sound effects are synthesized in the browser with the Web Audio
// API -- no audio files. Every exported playX() function builds a short
// envelope-shaped oscillator (or a few in sequence) and plays it
// immediately, unless muted. This module knows nothing about chess or
// unions; src/lib/gameSounds.js maps game events onto these.

const MUTE_KEY = 'chess-union-sound-muted'

function loadMuted() {
  try {
    // "muted off by default": nothing saved yet means sound is on.
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function saveMuted(value) {
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    // Private browsing or storage disabled: just skip remembering.
  }
}

let muted = loadMuted()

export function isMuted() {
  return muted
}

export function setMuted(value) {
  muted = value
  saveMuted(muted)
}

export function toggleMuted() {
  setMuted(!muted)
  return muted
}

let audioContext = null

function ensureContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!audioContext) audioContext = new AudioContextClass()
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {})
  return audioContext
}

let primed = false

// Browsers refuse to start audio before a user gesture. Call this once
// (e.g. on mount) to create + resume the context on the first click or
// keydown anywhere on the page, so the first real sound call doesn't pay
// that latency -- not a precondition for playback; ensureContext() does
// the same lazily if this was never called or the gesture hasn't
// happened yet.
export function primeAudioOnFirstGesture() {
  if (primed || typeof window === 'undefined') return
  primed = true
  const prime = () => {
    ensureContext()
    window.removeEventListener('click', prime)
    window.removeEventListener('keydown', prime)
  }
  window.addEventListener('click', prime, { once: true })
  window.addEventListener('keydown', prime, { once: true })
}

// One enveloped oscillator: linear attack, exponential decay to silence.
// startTime is seconds from now, so a sound made of several notes can lay
// them out relative to a single call. glideTo makes the oscillator's own
// pitch slide across its duration (the "wah-wah" effect). filterFreq adds
// a lowpass filter for a warmer/duller timbre (brass, thuds).
function tone(ctx, startTime, { frequency, type = 'sine', duration = 0.15, gain = 0.3, attack = 0.005, glideTo, filterFreq }) {
  const t0 = ctx.currentTime + startTime

  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, t0)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration)

  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, t0)
  envelope.gain.linearRampToValueAtTime(gain, t0 + attack)
  envelope.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  let lastNode = osc
  if (filterFreq) {
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = filterFreq
    osc.connect(filter)
    lastNode = filter
  }
  lastNode.connect(envelope)
  envelope.connect(ctx.destination)

  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

function play(build) {
  if (muted) return
  const ctx = ensureContext()
  if (!ctx) return
  build(ctx)
}

// Short soft "tock".
export function playMoveSound() {
  play((ctx) => {
    tone(ctx, 0, { frequency: 420, type: 'triangle', duration: 0.09, gain: 0.25, filterFreq: 1200 })
  })
}

// Sharper, lower "thud".
export function playCaptureSound() {
  play((ctx) => {
    tone(ctx, 0, { frequency: 140, type: 'square', duration: 0.16, gain: 0.3, filterFreq: 500 })
  })
}

// A quick two-note alert.
export function playCheckSound() {
  play((ctx) => {
    tone(ctx, 0, { frequency: 880, type: 'sine', duration: 0.09, gain: 0.3 })
    tone(ctx, 0.1, { frequency: 1108, type: 'sine', duration: 0.11, gain: 0.3 })
  })
}

// A short low "hmm" buzz.
export function playGrievanceSound() {
  play((ctx) => {
    tone(ctx, 0, { frequency: 110, type: 'sawtooth', duration: 0.35, gain: 0.22, filterFreq: 400 })
  })
}

// A short brass-like horn, then a short chant-like three-beat rhythm.
export function playStrikeSound() {
  play((ctx) => {
    tone(ctx, 0, { frequency: 220, type: 'sawtooth', duration: 0.28, gain: 0.28, filterFreq: 900 })
    tone(ctx, 0.32, { frequency: 196, type: 'square', duration: 0.1, gain: 0.25, filterFreq: 700 })
    tone(ctx, 0.46, { frequency: 196, type: 'square', duration: 0.1, gain: 0.25, filterFreq: 700 })
    tone(ctx, 0.6, { frequency: 196, type: 'square', duration: 0.14, gain: 0.25, filterFreq: 700 })
  })
}

// A slow descending two-note "wah-wah".
export function playWorkToRuleSound() {
  play((ctx) => {
    tone(ctx, 0, { frequency: 300, type: 'sawtooth', duration: 0.3, glideTo: 220, gain: 0.25, filterFreq: 600 })
    tone(ctx, 0.32, { frequency: 240, type: 'sawtooth', duration: 0.32, glideTo: 160, gain: 0.25, filterFreq: 600 })
  })
}

// Soft descending "zzz" tones.
export function playRookNapSound() {
  play((ctx) => {
    tone(ctx, 0, { frequency: 300, type: 'sine', duration: 0.18, gain: 0.18 })
    tone(ctx, 0.2, { frequency: 260, type: 'sine', duration: 0.18, gain: 0.16 })
    tone(ctx, 0.4, { frequency: 220, type: 'sine', duration: 0.22, gain: 0.14 })
  })
}

// A quick rising fanfare.
export function playStrikeBreakSound() {
  play((ctx) => {
    tone(ctx, 0, { frequency: 392, type: 'square', duration: 0.08, gain: 0.25, filterFreq: 1200 })
    tone(ctx, 0.08, { frequency: 494, type: 'square', duration: 0.08, gain: 0.25, filterFreq: 1200 })
    tone(ctx, 0.16, { frequency: 587, type: 'square', duration: 0.08, gain: 0.25, filterFreq: 1200 })
    tone(ctx, 0.24, { frequency: 784, type: 'square', duration: 0.18, gain: 0.3, filterFreq: 1400 })
  })
}

// A longer chord, for checkmate/stalemate/draw.
export function playGameOverSound() {
  play((ctx) => {
    tone(ctx, 0, { frequency: 196.0, type: 'triangle', duration: 1.1, gain: 0.2 })
    tone(ctx, 0, { frequency: 246.94, type: 'triangle', duration: 1.1, gain: 0.16 })
    tone(ctx, 0, { frequency: 293.66, type: 'triangle', duration: 1.1, gain: 0.16 })
  })
}
