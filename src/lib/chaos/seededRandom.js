// Deterministic PRNG (mulberry32) so a given seed always produces the same
// sequence of personalities and in-game rolls (refusals, rebel moves).
// Written as pure functions -- state in, {value, state} out -- rather than a
// closure, so chaos state stays a plain object like the rest of the app's
// state and a given (state, call count) always replays identically.

export function hashSeed(seed) {
  if (typeof seed === 'number') return seed >>> 0
  const text = String(seed)
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

export function nextRandom(state) {
  const a = (state + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, state: a }
}

// An integer in [0, maxExclusive).
export function randomInt(state, maxExclusive) {
  const { value, state: nextState } = nextRandom(state)
  return { value: Math.floor(value * maxExclusive), state: nextState }
}
