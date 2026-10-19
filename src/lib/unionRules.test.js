import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { applyMove, createUnionState, legalMoves } from './unionRules'

function hasEvent(news, type) {
  return news.some((event) => event.type === type)
}

// Builds a state with a fresh chess.js game and the given pawn-union
// overrides already in place, for tests that start mid-way through a
// union's lifecycle instead of replaying a whole game.
function stateWithPawns(fen, overrides = {}) {
  const unions = createUnionState()
  if (overrides.white) {
    unions.white = { pawns: { ...unions.white.pawns, ...overrides.white } }
  }
  if (overrides.black) {
    unions.black = { pawns: { ...unions.black.pawns, ...overrides.black } }
  }
  return { chess: new Chess(fen), unions, news: [] }
}

describe('unpaid losses and grievance', () => {
  it('files a grievance when a pawn is lost and the next move is not a capture', () => {
    let state = { chess: new Chess(), unions: createUnionState(), news: [] }
    for (const move of ['e4', 'd5', 'Nc3', 'dxe4']) {
      state = applyMove(state, move)
    }

    // White's e4 pawn was just captured; White now plays a quiet move
    // instead of recapturing.
    state = applyMove(state, 'Nf3')

    expect(state.unions.white.pawns.grievance).toBe(1)
    expect(state.unions.white.pawns.status).toBe('grumbling')
    expect(hasEvent(state.news, 'grievance-filed')).toBe(true)
    expect(hasEvent(state.news, 'grumbling')).toBe(true)
  })

  it('does not file a grievance when the loss is immediately repaid by a recapture', () => {
    let state = { chess: new Chess(), unions: createUnionState(), news: [] }
    for (const move of ['e4', 'd5', 'Nc3', 'dxe4']) {
      state = applyMove(state, move)
    }

    // White recaptures on e4 straight away: the debt is paid, not filed.
    state = applyMove(state, 'Nxe4')

    expect(state.unions.white.pawns.grievance).toBe(0)
    expect(state.unions.white.pawns.status).toBe('calm')
    expect(hasEvent(state.news, 'grievance-filed')).toBe(false)
  })

  it('lowers grievance by 1 for every capture a side makes', () => {
    const state = stateWithPawns('k7/8/8/8/3p4/8/8/K2Q4 w - - 0 1', {
      white: { grievance: 2, status: 'grumbling' },
    })

    const next = applyMove(state, 'Qxd4')

    expect(next.unions.white.pawns.grievance).toBe(1)
    expect(next.unions.white.pawns.status).toBe('grumbling')
    expect(hasEvent(next.news, 'capture-calms')).toBe(true)
  })
})

describe('pawn strikes', () => {
  it('starts a 3-turn strike once pawn grievance reaches 3 unpaid losses', () => {
    const state = stateWithPawns('k7/8/8/8/8/8/8/K5N1 w - - 0 1', {
      white: { grievance: 2, status: 'grumbling', pendingUnpaidLoss: true },
    })

    // A quiet move while a pawn-loss debt is outstanding: the third unpaid
    // loss pushes grievance to the limit and the strike begins.
    const next = applyMove(state, 'Nf3')

    expect(next.unions.white.pawns).toEqual({
      grievance: 3,
      status: 'strike',
      turnsLeft: 3,
      pendingUnpaidLoss: false,
    })
    expect(hasEvent(next.news, 'strike')).toBe(true)
  })

  it("ends the strike after 3 of the side's turns and enters a 5-turn cooldown", () => {
    const state = stateWithPawns('k7/8/8/8/8/8/8/K5N1 w - - 0 1', {
      white: { grievance: 3, status: 'strike', turnsLeft: 1 },
    })

    // The last of the 3 strike turns passes.
    const next = applyMove(state, 'Nf3')

    expect(next.unions.white.pawns).toEqual({
      grievance: 0,
      status: 'cooldown',
      turnsLeft: 5,
      pendingUnpaidLoss: false,
    })
    expect(hasEvent(next.news, 'strike-ends')).toBe(true)
  })

  it('does not let grievance start a new strike while the union is in cooldown', () => {
    const state = stateWithPawns('k7/8/8/8/8/8/8/K5N1 w - - 0 1', {
      white: { grievance: 0, status: 'cooldown', turnsLeft: 2, pendingUnpaidLoss: true },
    })

    const next = applyMove(state, 'Nf3')

    expect(next.unions.white.pawns.grievance).toBe(0)
    expect(next.unions.white.pawns.status).toBe('cooldown')
    expect(next.unions.white.pawns.turnsLeft).toBe(1)
    expect(hasEvent(next.news, 'strike')).toBe(false)
    expect(hasEvent(next.news, 'grievance-filed')).toBe(false)
  })
})

describe('strike-break', () => {
  it('breaks the strike immediately when it would leave the side with no legal move', () => {
    // White, on strike, is in check and the only legal move in the entire
    // position is a pawn capturing the checking knight.
    const fen = 'k4r2/8/8/8/8/3n4/2q1P3/4K3 w - - 0 1'
    const unions = createUnionState()
    unions.white = { pawns: { ...unions.white.pawns, grievance: 3, status: 'strike', turnsLeft: 2 } }

    const result = legalMoves(new Chess(fen), unions)

    expect(result.moves).toHaveLength(1)
    expect(result.moves[0].san).toBe('exd3')
    expect(result.unions.white.pawns.status).toBe('cooldown')
    expect(result.unions.white.pawns.grievance).toBe(0)
    expect(hasEvent(result.news, 'strike-break')).toBe(true)
  })
})

describe('move filtering during a strike', () => {
  it('blocks en passant and promotion moves for pawns on strike, same as any other pawn move', () => {
    // White has both an en passant capture and a pawn one push from
    // promoting, plus a knight move that is unaffected by the strike.
    const fen = '7k/P7/8/3pP3/8/8/8/K5N1 w - d6 0 1'
    const unions = createUnionState()
    unions.white = { pawns: { ...unions.white.pawns, grievance: 3, status: 'strike', turnsLeft: 2 } }

    const result = legalMoves(new Chess(fen), unions)

    const sans = result.moves.map((move) => move.san)
    expect(sans).not.toContain('exd6')
    expect(sans).not.toContain('a8=Q+')
    expect(sans).toContain('Nf3')
    // No strike-break: the knight move keeps the filtered list non-empty.
    expect(result.unions.white.pawns.status).toBe('strike')
  })
})

describe('regression', () => {
  it("still ends fool's mate correctly with the union layer wired in", () => {
    let state = { chess: new Chess(), unions: createUnionState(), news: [] }

    for (const move of ['f3', 'e5', 'g4', 'Qh4']) {
      const { moves } = legalMoves(state.chess, state.unions)
      expect(moves.some((m) => m.san.replace(/[+#]$/, '') === move)).toBe(true)
      state = applyMove(state, move)
    }

    expect(state.chess.isCheckmate()).toBe(true)
    expect(state.chess.isGameOver()).toBe(true)
  })
})
