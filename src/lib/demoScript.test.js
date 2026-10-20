import { describe, expect, it } from 'vitest'
import { DEMO_CASES } from './demoScript'
import { playCase } from './demoRunner'

function lastFrame(frames) {
  return frames[frames.length - 1]
}

function newsOfType(frames, type) {
  return frames.flatMap((frame) => frame.news).filter((event) => event.type === type)
}

describe('demo script', () => {
  it('has exactly the 6 cases in order', () => {
    expect(DEMO_CASES.map((c) => c.id)).toEqual([
      'grievance',
      'pawn-strike',
      'capture-calms',
      'minors-work-to-rule',
      'rook-nap',
      'strike-break',
    ])
  })

  it('every case plays without throwing (every scripted move is legal and union-permitted)', () => {
    for (const demoCase of DEMO_CASES) {
      expect(() => playCase(demoCase), demoCase.id).not.toThrow()
    }
  })

  it('case 1 (grievance): one unpaid pawn loss files a grievance, no strike yet', () => {
    const frames = playCase(DEMO_CASES[0])
    const end = lastFrame(frames)
    expect(end.unions.white.pawns.grievance).toBe(1)
    expect(end.unions.white.pawns.status).toBe('grumbling')
    expect(newsOfType(frames, 'grievance-filed')).toHaveLength(1)
    expect(newsOfType(frames, 'strike')).toHaveLength(0)
  })

  it('case 2 (pawn-strike): the third unpaid loss triggers the strike, and the blocked attempt is refused', () => {
    const frames = playCase(DEMO_CASES[1])
    const strikeEvents = newsOfType(frames, 'strike')
    expect(strikeEvents).toHaveLength(1)
    expect(strikeEvents[0]).toMatchObject({ side: 'white', union: 'pawns' })

    const end = lastFrame(frames)
    expect(end.kind).toBe('blocked-attempt')
    expect(end.unions.white.pawns.status).toBe('strike')
    expect(end.message).toBe('Pawns are on strike (3 turns left)')
  })

  it('case 3 (capture-calms): a single capture lowers both primed grievance counters', () => {
    const frames = playCase(DEMO_CASES[2])
    const end = lastFrame(frames)
    expect(end.unions.white.pawns.grievance).toBe(0)
    expect(end.unions.white.minors.grievance).toBe(0)
    expect(newsOfType(frames, 'capture-calms')).toHaveLength(2)
  })

  it('case 4 (minors-work-to-rule): the second unpaid minor loss restricts the remaining bishop, and the over-reach is refused', () => {
    const frames = playCase(DEMO_CASES[3])
    const strikeEvents = newsOfType(frames, 'strike')
    expect(strikeEvents).toHaveLength(1)
    expect(strikeEvents[0]).toMatchObject({ side: 'white', union: 'minors' })

    const end = lastFrame(frames)
    expect(end.kind).toBe('blocked-attempt')
    expect(end.unions.white.minors.status).toBe('strike')
    expect(end.message).toBe('Bishops are on work-to-rule (3 turns left)')
  })

  it('case 5 (rook-nap): the 4th consecutive rook move triggers the sit-out, and the rook is refused', () => {
    const frames = playCase(DEMO_CASES[4])
    const strikeEvents = newsOfType(frames, 'strike')
    expect(strikeEvents).toHaveLength(1)
    expect(strikeEvents[0]).toMatchObject({ side: 'white', union: 'rooks' })

    const end = lastFrame(frames)
    expect(end.kind).toBe('blocked-attempt')
    expect(end.unions.white.rooks.status).toBe('strike')
    expect(end.message).toBe('Rooks are asleep (1 turn left)')
  })

  it('case 6 (strike-break): the only legal response, a striking pawn capturing check, forces the strike to break', () => {
    const frames = playCase(DEMO_CASES[5])
    expect(frames[0].kind).toBe('setup')
    expect(frames[0].unions.white.pawns.status).toBe('strike')

    const breakEvents = newsOfType(frames, 'strike-break')
    expect(breakEvents).toHaveLength(1)
    expect(breakEvents[0]).toMatchObject({ side: 'white', union: 'pawns' })

    const end = lastFrame(frames)
    expect(end.moveSan).toBe('exd3')
    expect(end.unions.white.pawns.status).toBe('cooldown')
  })
})
