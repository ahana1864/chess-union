import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { pickBotMove } from './bot'

describe('pickBotMove', () => {
  it('returns null when there are no legal moves', () => {
    expect(pickBotMove(new Chess(), [], { mode: 'greedy' })).toBeNull()
    expect(pickBotMove(new Chess(), [], { mode: 'random' })).toBeNull()
  })

  describe('random mode', () => {
    const chess = new Chess()
    const moves = chess.moves({ verbose: true })

    it('respects an injected rng (always picks the first candidate)', () => {
      const move = pickBotMove(chess, moves, { mode: 'random', rng: () => 0 })
      expect(move).toBe(moves[0])
    })

    it('respects an injected rng (always picks the last candidate)', () => {
      const move = pickBotMove(chess, moves, { mode: 'random', rng: () => 0.999999 })
      expect(move).toBe(moves[moves.length - 1])
    })
  })

  describe('greedy mode', () => {
    it('prefers a safe capture over quiet moves', () => {
      // White queen can safely take an undefended black rook.
      const chess = new Chess('k7/8/8/8/3r4/8/8/K2Q2N1 w - - 0 1')
      const moves = chess.moves({ verbose: true })

      const move = pickBotMove(chess, moves, { mode: 'greedy', rng: () => 0 })

      expect(move.san).toBe('Qxd4')
    })

    it('avoids hanging a piece even when a bigger capture is on offer', () => {
      // The rook on d4 is defended by the pawn on c5. Taking it with the
      // queen nets queen-for-rook (a blunder); taking it with the knight
      // nets knight-for-rook (a fair trade) and scores higher.
      const chess = new Chess('k7/8/8/2p5/3r3b/5N2/8/K2Q4 w - - 0 1')
      const moves = chess.moves({ verbose: true })

      const move = pickBotMove(chess, moves, { mode: 'greedy', rng: () => 0 })

      expect(move.san).toBe('Nxd4')
    })

    it('only ever promotes to a queen', () => {
      const chess = new Chess('7k/P7/8/3pP3/8/8/8/K5N1 w - d6 0 1')
      const promotionChoices = chess
        .moves({ verbose: true })
        .filter((move) => move.from === 'a7' && move.to === 'a8')
      expect(promotionChoices.length).toBeGreaterThan(1) // more than one choice exists

      const move = pickBotMove(chess, promotionChoices, { mode: 'greedy', rng: () => 0 })

      expect(move.promotion).toBe('q')
    })
  })
})
