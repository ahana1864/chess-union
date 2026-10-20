import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const MUTE_KEY = 'chess-union-sound-muted'

// This project's Vitest config has no DOM (node environment, no jsdom
// dependency) and sound.js imports/calls localStorage directly, same as
// every other module in this codebase that persists a setting -- so tests
// here provide a minimal in-memory stand-in rather than pull in jsdom
// just for one test file.
function installFakeLocalStorage() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  }
}

describe('sound', () => {
  beforeEach(() => {
    installFakeLocalStorage()
  })

  afterEach(() => {
    delete globalThis.localStorage
  })

  it('is unmuted by default when nothing is saved', async () => {
    vi.resetModules()
    const { isMuted } = await import('./sound')
    expect(isMuted()).toBe(false)
  })

  it('toggleMuted flips and returns the new state, and persists it', async () => {
    vi.resetModules()
    const { isMuted, toggleMuted } = await import('./sound')
    expect(toggleMuted()).toBe(true)
    expect(isMuted()).toBe(true)
    expect(localStorage.getItem(MUTE_KEY)).toBe('1')
  })

  it('setMuted(false) un-persists back to "0"', async () => {
    vi.resetModules()
    const { setMuted } = await import('./sound')
    setMuted(true)
    setMuted(false)
    expect(localStorage.getItem(MUTE_KEY)).toBe('0')
  })

  it('a fresh module load honours a previously saved muted state', async () => {
    installFakeLocalStorage()
    localStorage.setItem(MUTE_KEY, '1')
    vi.resetModules()
    const { isMuted } = await import('./sound')
    expect(isMuted()).toBe(true)
  })

  it('falls back to unmuted, without throwing, when localStorage is unavailable', async () => {
    delete globalThis.localStorage
    vi.resetModules()
    const { isMuted, setMuted } = await import('./sound')
    expect(isMuted()).toBe(false)
    expect(() => setMuted(true)).not.toThrow()
  })

  it('every play function runs without throwing even with no Web Audio API (no AudioContext here)', async () => {
    vi.resetModules()
    const sound = await import('./sound')
    const playFns = [
      sound.playMoveSound,
      sound.playCaptureSound,
      sound.playCheckSound,
      sound.playGrievanceSound,
      sound.playStrikeSound,
      sound.playWorkToRuleSound,
      sound.playRookNapSound,
      sound.playStrikeBreakSound,
      sound.playGameOverSound,
    ]
    for (const fn of playFns) expect(fn).not.toThrow()
  })

  it('primeAudioOnFirstGesture is safe to call repeatedly and does not throw', async () => {
    vi.resetModules()
    const { primeAudioOnFirstGesture } = await import('./sound')
    expect(() => {
      primeAudioOnFirstGesture()
      primeAudioOnFirstGesture()
    }).not.toThrow()
  })
})
