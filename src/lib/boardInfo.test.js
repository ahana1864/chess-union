import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { restrictedSquares, sideHasBishop } from './boardInfo'
import { createUnionState } from './unionRules'

describe('restrictedSquares', () => {
  it('lists every bishop of the side once minors are on strike', () => {
    const chess = new Chess()
    const unions = createUnionState()
    unions.white = { ...unions.white, minors: { ...unions.white.minors, status: 'strike' } }

    expect(restrictedSquares(chess, unions, 'white').sort()).toEqual(['c1', 'f1'])
  })

  it('lists every rook of the side once rooks are sitting out', () => {
    const chess = new Chess()
    const unions = createUnionState()
    unions.black = { ...unions.black, rooks: { ...unions.black.rooks, status: 'strike' } }

    expect(restrictedSquares(chess, unions, 'black').sort()).toEqual(['a8', 'h8'])
  })

  it('combines both lists when minors and rooks are restricted together', () => {
    const chess = new Chess()
    const unions = createUnionState()
    unions.white = {
      ...unions.white,
      minors: { ...unions.white.minors, status: 'strike' },
      rooks: { ...unions.white.rooks, status: 'strike' },
    }

    expect(restrictedSquares(chess, unions, 'white').sort()).toEqual(['a1', 'c1', 'f1', 'h1'])
  })

  it('is empty when neither union is restricting that side', () => {
    const chess = new Chess()
    const unions = createUnionState()

    expect(restrictedSquares(chess, unions, 'white')).toEqual([])
  })
})

describe('sideHasBishop', () => {
  it('is false once both of a side\'s bishops are gone', () => {
    const chess = new Chess('k7/8/8/8/8/8/8/K1Q5 w - - 0 1')
    expect(sideHasBishop(chess, 'white')).toBe(false)
  })
})
