import { describe, expect, it } from 'vitest'
import { headlineFor } from './headlines'

const EVENT_TYPES = [
  'grievance-filed',
  'grumbling',
  'strike',
  'strike-ends',
  'cooldown',
  'strike-break',
  'capture-calms',
]

describe('headlineFor', () => {
  it('returns non-empty text for every union event type', () => {
    for (const type of EVENT_TYPES) {
      for (const union of ['pawns', 'minors', 'rooks']) {
        const { text } = headlineFor({ type, side: 'white', union, grievance: 2 })
        expect(text.length).toBeGreaterThan(0)
      }
    }
  })

  it('gives minors and rooks their own wording for strike/strike-ends/strike-break, not pawns’', () => {
    for (const type of ['strike', 'strike-ends', 'strike-break']) {
      const pawns = headlineFor({ type, side: 'white', union: 'pawns' })
      const minors = headlineFor({ type, side: 'white', union: 'minors' })
      const rooks = headlineFor({ type, side: 'white', union: 'rooks' })
      expect(minors.text).not.toBe(pawns.text)
      expect(rooks.text).not.toBe(pawns.text)
      expect(minors.text.toLowerCase()).toContain('bishop')
      expect(rooks.text.toLowerCase()).toContain('rook')
    }
  })

  it('is deterministic: the same event always produces the same headline', () => {
    const event = { type: 'strike', side: 'black', union: 'pawns' }
    const first = headlineFor(event)
    const second = headlineFor({ ...event })
    expect(first.text).toBe(second.text)
    expect(first.tone).toBe(second.tone)
  })

  it('mentions the side in the headline', () => {
    const white = headlineFor({ type: 'strike', side: 'white', union: 'pawns' })
    const black = headlineFor({ type: 'strike', side: 'black', union: 'pawns' })
    expect(white.text.toLowerCase()).toContain('white')
    expect(black.text.toLowerCase()).toContain('black')
  })
})
