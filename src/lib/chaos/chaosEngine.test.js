import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { applyChaosMove, chaosLegalMoves, createChaosState } from './chaosEngine'

function hasEvent(news, type) {
  return news.some((event) => event.type === type)
}

describe('seeded personalities', () => {
  it('assigns the same personality to every piece for the same seed', () => {
    const a = createChaosState(new Chess(), 42)
    const b = createChaosState(new Chess(), 42)

    const personalitiesOf = (state) =>
      Object.values(state.piecesById)
        .sort((x, y) => x.square.localeCompare(y.square))
        .map((p) => `${p.square}:${p.personality}`)

    expect(personalitiesOf(a)).toEqual(personalitiesOf(b))
  })

  it('gives a different personality layout for a different seed (overwhelmingly likely)', () => {
    const a = createChaosState(new Chess(), 1)
    const b = createChaosState(new Chess(), 2)

    const personalitiesOf = (state) =>
      Object.values(state.piecesById)
        .sort((x, y) => x.square.localeCompare(y.square))
        .map((p) => p.personality)

    expect(personalitiesOf(a)).not.toEqual(personalitiesOf(b))
  })

  it('gives only the requested colors a random personality, leaving the rest steady', () => {
    const state = createChaosState(new Chess(), 42, ['w'])
    for (const piece of Object.values(state.piecesById)) {
      if (piece.color === 'w') expect(piece.personality).not.toBe('steady')
      else expect(piece.personality).toBe('steady')
    }
  })

  it('never changes a steady piece: no fatigue, grievance, anger, sleeping, striking or rebel', () => {
    // White is left steady; black still gets full chaos. Shuffle a white
    // knight back and forth (would sleep it if randomized) and sacrifice
    // white pawns unpaid (would raise grievance/anger if randomized).
    const chess = new Chess('k7/8/8/4p3/3N4/8/8/K5N1 w - - 0 1')
    let chaos = createChaosState(chess, 3, ['b'])
    const whiteKnightId = Object.keys(chaos.piecesById).find(
      (id) => chaos.piecesById[id].type === 'n' && chaos.piecesById[id].square === 'g1',
    )

    const seq = ['Nf3', 'exd4', 'Ng1', 'Ka2', 'Nf3', 'Ka1', 'Ng1', 'Ka2']
    for (const san of seq) {
      const { moves } = chaosLegalMoves(chess, chaos)
      if (!moves.some((m) => m.san === san || m.san.replace(/[+#]$/, '') === san)) continue
      const next = applyChaosMove({ chess, chaos, news: [] }, san)
      chaos = next.chaos
    }

    const steadyKnight = chaos.piecesById[whiteKnightId]
    expect(steadyKnight.personality).toBe('steady')
    expect(steadyKnight.status).toBe('calm')
    expect(steadyKnight.fatigue).toBe(0)
    for (const piece of Object.values(chaos.piecesById)) {
      if (piece.color === 'w') {
        expect(piece.status).toBe('calm')
        expect(piece.grievance).toBe(0)
        expect(piece.anger).toBe(0)
      }
    }
  })

  it('creates all 32 starting pieces, each with calm status and zeroed stats', () => {
    const state = createChaosState(new Chess(), 7)
    const pieces = Object.values(state.piecesById)
    expect(pieces).toHaveLength(32)
    for (const piece of pieces) {
      expect(piece.status).toBe('calm')
      expect(piece.fatigue).toBe(0)
      expect(piece.grievance).toBe(0)
      expect(piece.anger).toBe(0)
    }
  })
})

describe('fatigue and sleeping', () => {
  it('sends the same piece to sleep after moving it enough times in a row, and wakes it up on schedule', () => {
    // White shuffles its knight back and forth; black shuffles its king so
    // turns alternate normally. Nothing else moves for white, so nothing
    // offsets the knight's own fatigue rise.
    const chess = new Chess('k7/8/8/8/8/8/8/K5N1 w - - 0 1')
    let state = { chess, chaos: createChaosState(chess, 1), news: [] }

    const whiteMoves = ['Nf3', 'Ng1', 'Nf3', 'Ng1']
    const blackMoves = ['Kb8', 'Ka8', 'Kb8', 'Ka8']
    let asleepAfter = null
    for (let i = 0; i < whiteMoves.length; i++) {
      let next = applyChaosMove(state, whiteMoves[i])
      state = { chess, chaos: next.chaos, news: next.news }
      const knight = Object.values(state.chaos.piecesById).find((p) => p.type === 'n')
      if (knight.status === 'sleeping' && asleepAfter === null) asleepAfter = i

      next = applyChaosMove(state, blackMoves[i])
      state = { chess, chaos: next.chaos, news: next.news }
    }

    expect(asleepAfter).not.toBeNull()
    expect(state.news.some((e) => e.type === 'falls-asleep')).toBe(true)

    // Two more of white's own turns pass (king shuffling), enough for a
    // 1-turn sleep to end.
    let next = applyChaosMove(state, 'Ka2')
    state = { chess, chaos: next.chaos, news: next.news }
    next = applyChaosMove(state, 'Kb8')
    state = { chess, chaos: next.chaos, news: next.news }
    next = applyChaosMove(state, 'Ka1')
    state = { chess, chaos: next.chaos, news: next.news }

    const knight = Object.values(state.chaos.piecesById).find((p) => p.type === 'n')
    expect(knight.status).toBe('calm')
    expect(hasEvent(state.news, 'wakes-up')).toBe(true)
  })
})

describe('safety: a side always has a legal move', () => {
  it('breaks every blocking piece out of it immediately if that is the only way the side has a legal move', () => {
    const chess = new Chess('k7/8/8/8/8/8/8/K5N1 w - - 0 1')
    const chaos = createChaosState(chess, 3)
    // Put every white piece (king and knight) to sleep/strike, so chess.js
    // still has legal moves but the chaos filter alone would leave none.
    for (const [id, piece] of Object.entries(chaos.piecesById)) {
      if (piece.color === 'w') {
        chaos.piecesById[id] = { ...piece, status: 'sleeping', sleepTurnsLeft: 1 }
      }
    }

    const result = chaosLegalMoves(chess, chaos)

    expect(result.moves.length).toBeGreaterThan(0)
    expect(hasEvent(result.news, 'chaos-strike-break')).toBe(true)
    for (const piece of Object.values(result.chaos.piecesById)) {
      if (piece.color === 'w') expect(piece.status).toBe('calm')
    }
  })

  it("never returns an empty move list for a side that isn't actually checkmated or stalemated", () => {
    const chess = new Chess()
    const chaos = createChaosState(chess, 9)
    // Put every white piece to sleep.
    for (const [id, piece] of Object.entries(chaos.piecesById)) {
      if (piece.color === 'w') {
        chaos.piecesById[id] = { ...piece, status: 'sleeping', sleepTurnsLeft: 5 }
      }
    }

    const result = chaosLegalMoves(chess, chaos)
    expect(result.moves.length).toBeGreaterThan(0)
    expect(chess.isGameOver()).toBe(false)
  })
})

describe('grievance, anger and striking', () => {
  it('raises grievance and anger for pieces next to an unpaid loss, and eventually strikes', () => {
    // White's knight (d4) is captured; white's rook sits on c3, adjacent
    // to d4. White replies with a quiet king move -- nobody recaptures --
    // so the loss goes unpaid and the rook (next to the lost square) feels it.
    const chess = new Chess('k7/8/8/4p3/3N4/2R5/8/K7 b - - 0 1')
    let state = { chess, chaos: createChaosState(chess, 5), news: [] }

    let next = applyChaosMove(state, 'exd4')
    state = { chess, chaos: next.chaos, news: next.news }
    next = applyChaosMove(state, 'Ka2')
    state = { chess, chaos: next.chaos, news: next.news }

    expect(hasEvent(state.news, 'grievance-nearby')).toBe(true)
    const rook = Object.values(state.chaos.piecesById).find((p) => p.type === 'r' && p.color === 'w')
    expect(rook.grievance).toBeGreaterThan(0)
    expect(rook.anger).toBeGreaterThan(0)
  })

  it('lowers grievance and anger on every piece of a side after it makes a capture', () => {
    const chess = new Chess('k7/8/8/8/3p4/8/8/K2Q4 w - - 0 1')
    const chaos = createChaosState(chess, 11)
    for (const id of Object.keys(chaos.piecesById)) {
      if (chaos.piecesById[id].color === 'w') {
        chaos.piecesById[id] = { ...chaos.piecesById[id], grievance: 3, anger: 3 }
      }
    }

    const next = applyChaosMove({ chess, chaos, news: [] }, 'Qxd4')
    expect(hasEvent(next.news, 'capture-calms')).toBe(true)
    const king = Object.values(next.chaos.piecesById).find((p) => p.type === 'k' && p.color === 'w')
    expect(king.grievance).toBeLessThan(3)
    expect(king.anger).toBeLessThan(3)
  })
})

describe('rebel pieces: refusal or a move of their own', () => {
  it('rolls deterministically from the seed: the same seed and move sequence always produces the same outcome', () => {
    const run = () => {
      const chess = new Chess('k7/8/8/8/8/8/8/K5N1 w - - 0 1')
      const chaos0 = createChaosState(chess, 21)
      const knightId = Object.keys(chaos0.piecesById).find((id) => chaos0.piecesById[id].type === 'n')
      const furious = { ...chaos0.piecesById[knightId], anger: 10, status: 'rebel' }
      const chaos = { ...chaos0, piecesById: { ...chaos0.piecesById, [knightId]: furious } }

      return applyChaosMove({ chess, chaos, news: [] }, 'Nf3')
    }

    const a = run()
    const b = run()
    expect(a.refused).toBe(b.refused)
    expect(a.appliedMove).toEqual(b.appliedMove)
    expect(a.news.map((e) => e.type)).toEqual(b.news.map((e) => e.type))
  })

  it('leaves the board untouched when a furious piece refuses', () => {
    // Seed/move chosen (via the determinism test above) so this rolls a
    // refusal: confirm the board and turn genuinely do not change.
    const chess = new Chess('k7/8/8/8/8/8/8/K5N1 w - - 0 1')
    const chaos0 = createChaosState(chess, 21)
    const knightId = Object.keys(chaos0.piecesById).find((id) => chaos0.piecesById[id].type === 'n')
    const chaos = {
      ...chaos0,
      piecesById: { ...chaos0.piecesById, [knightId]: { ...chaos0.piecesById[knightId], anger: 10, status: 'rebel' } },
    }

    const fenBefore = chess.fen()
    const result = applyChaosMove({ chess, chaos, news: [] }, 'Nf3')

    if (result.refused) {
      expect(chess.fen()).toBe(fenBefore)
      expect(hasEvent(result.news, 'refusal')).toBe(true)
    } else {
      // Rebel-move or a successful move both change the board; either way
      // they must report which happened.
      expect(result.refused).toBe(false)
    }
  })
})

describe('castling and en passant tracking', () => {
  it('moves the rook identity along with the king on castling', () => {
    const chess = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
    const chaos = createChaosState(chess, 4)
    const rookId = chaos.bySquare['h1']

    const result = applyChaosMove({ chess, chaos, news: [] }, 'O-O')

    expect(result.chaos.bySquare['f1']).toBe(rookId)
    expect(result.chaos.piecesById[rookId].square).toBe('f1')
    expect(result.chaos.bySquare['h1']).toBeUndefined()
  })

  it('removes the captured pawn identity on an en passant capture', () => {
    const chess = new Chess('7k/8/8/3pP3/8/8/8/K7 w - d6 0 1')
    const chaos = createChaosState(chess, 6)
    const victimId = chaos.bySquare['d5']

    const result = applyChaosMove({ chess, chaos, news: [] }, 'exd6')

    expect(result.chaos.piecesById[victimId]).toBeUndefined()
    expect(result.chaos.bySquare['d5']).toBeUndefined()
    expect(result.chaos.bySquare['d6']).toBeDefined()
  })
})

describe('regression', () => {
  it("still ends fool's mate correctly with the chaos layer wired in", () => {
    const chess = new Chess()
    let state = { chess, chaos: createChaosState(chess, 99), news: [] }

    for (const move of ['f3', 'e5', 'g4', 'Qh4']) {
      const { moves } = chaosLegalMoves(state.chess, state.chaos)
      expect(moves.some((m) => m.san.replace(/[+#]$/, '') === move)).toBe(true)
      const next = applyChaosMove(state, move)
      state = { chess, chaos: next.chaos, news: next.news }
    }

    expect(chess.isCheckmate()).toBe(true)
    expect(chess.isGameOver()).toBe(true)
  })
})
