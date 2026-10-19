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
    unions.white = { ...unions.white, pawns: { ...unions.white.pawns, ...overrides.white } }
  }
  if (overrides.black) {
    unions.black = { ...unions.black, pawns: { ...unions.black.pawns, ...overrides.black } }
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
    unions.white = {
      ...unions.white,
      pawns: { ...unions.white.pawns, grievance: 3, status: 'strike', turnsLeft: 2 },
    }

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
    unions.white = {
      ...unions.white,
      pawns: { ...unions.white.pawns, grievance: 3, status: 'strike', turnsLeft: 2 },
    }

    const result = legalMoves(new Chess(fen), unions)

    const sans = result.moves.map((move) => move.san)
    expect(sans).not.toContain('exd6')
    expect(sans).not.toContain('a8=Q+')
    expect(sans).toContain('Nf3')
    // No strike-break: the knight move keeps the filtered list non-empty.
    expect(result.unions.white.pawns.status).toBe('strike')
  })
})

describe('bishop work-to-rule', () => {
  it('starts working to rule after 2 unpaid bishop losses', () => {
    const unions = createUnionState()
    unions.white = {
      ...unions.white,
      bishops: { ...unions.white.bishops, grievance: 1, status: 'grumbling', pendingUnpaidLoss: true },
    }
    const chess = new Chess('k7/8/8/8/8/8/8/K5N1 w - - 0 1')

    const next = applyMove({ chess, unions, news: [] }, 'Nf3')

    expect(next.unions.white.bishops).toEqual({
      grievance: 2,
      status: 'strike',
      turnsLeft: 3,
      pendingUnpaidLoss: false,
    })
    expect(hasEvent(next.news, 'strike')).toBe(true)
  })

  it('limits bishop moves to at most 2 squares while working to rule, leaving other pieces alone', () => {
    const fen = 'k7/8/8/8/8/8/8/K1B5 w - - 0 1'
    const unions = createUnionState()
    unions.white = {
      ...unions.white,
      bishops: { ...unions.white.bishops, grievance: 2, status: 'strike', turnsLeft: 2 },
    }

    const result = legalMoves(new Chess(fen), unions)

    const sans = result.moves.map((move) => move.san)
    expect(sans).toContain('Be3') // 2 squares away: allowed
    expect(sans).not.toContain('Bf4') // 3 squares away: blocked
    expect(sans).not.toContain('Bh6') // 5 squares away: blocked
    expect(sans).toContain('Ka2') // king moves are never affected
  })
})

describe('rook union break', () => {
  function playRookShuffle(moveCount) {
    let state = {
      chess: new Chess('6kn/8/8/8/8/8/8/R3K3 w - - 0 1'),
      unions: createUnionState(),
      news: [],
    }
    const whiteMoves = ['Ra2', 'Ra1', 'Ra2', 'Ra1']
    const blackMoves = ['Nf7', 'Nh8', 'Nf7', 'Nh8']
    for (let i = 0; i < moveCount; i++) {
      state = applyMove(state, whiteMoves[i])
      if (i < moveCount - 1) state = applyMove(state, blackMoves[i])
    }
    return state
  }

  it('sits out for 1 turn after the same rook moves 4 times in a row', () => {
    const state = playRookShuffle(4)

    expect(state.unions.white.rooks).toEqual({
      consecutiveMoves: 4,
      trackedSquare: 'a1',
      status: 'strike',
      turnsLeft: 1,
    })
    expect(hasEvent(state.news, 'strike')).toBe(true)
  })

  it('resets the streak when a different piece moves instead', () => {
    let state = playRookShuffle(2) // Ra2, Nf7, Ra1 -> consecutiveMoves 2, black to move
    state = applyMove(state, 'Nh8') // black replies
    state = applyMove(state, 'Kd2') // king moves instead of the rook

    expect(state.unions.white.rooks.consecutiveMoves).toBe(0)
    expect(state.unions.white.rooks.status).toBe('calm')
  })

  it('blocks rook moves while sitting out, but not other pieces, and returns to calm (no cooldown) after 1 turn', () => {
    const struckState = playRookShuffle(4)

    const filtered = legalMoves(struckState.chess, struckState.unions)
    const sans = filtered.moves.map((move) => move.san)
    expect(sans.some((san) => san.startsWith('R'))).toBe(false)
    expect(sans.length).toBeGreaterThan(0) // the king can still move

    // Black replies, then white's next move is the rook union's 1 sit-out turn.
    let state = applyMove(struckState, 'Nh8')
    state = applyMove(state, 'Kd2')

    expect(state.unions.white.rooks).toEqual({
      consecutiveMoves: 0,
      trackedSquare: null,
      status: 'calm', // not 'cooldown' -- rooks skip it entirely
      turnsLeft: 0,
    })
    expect(hasEvent(state.news, 'strike-ends')).toBe(true)
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
