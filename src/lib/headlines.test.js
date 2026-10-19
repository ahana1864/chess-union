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
      const { text } = headlineFor({ type, side: 'white', union: 'pawns', grievance: 2 })
      expect(text.length).toBeGreaterThan(0)
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
