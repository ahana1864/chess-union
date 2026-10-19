import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'

describe('chess.js smoke test', () => {
  it('plays a short legal game and detects check', () => {
    const chess = new Chess()
    chess.move('f3')
    chess.move('e5')
    chess.move('g4')

    expect(chess.isCheck()).toBe(false)
    expect(chess.isCheckmate()).toBe(false)
  })

  it("ends fool's mate in checkmate for the side to move", () => {
    const chess = new Chess()
    chess.move('f3')
    chess.move('e5')
    chess.move('g4')
    chess.move('Qh4')

    expect(chess.isCheck()).toBe(true)
    expect(chess.isCheckmate()).toBe(true)
    expect(chess.isGameOver()).toBe(true)
    expect(chess.turn()).toBe('w')
  })
})
