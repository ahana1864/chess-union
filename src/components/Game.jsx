import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useRef, useState } from 'react'
import { pieceRenderers } from './pieceRenderers'
import { PromotionPicker } from './PromotionPicker'

const FILES = 'abcdefgh'

function isLightSquare(square) {
  const file = FILES.indexOf(square[0])
  const rank = Number(square[1]) - 1
  return (file + rank) % 2 === 1
}

function statusText(chess) {
  const toMove = chess.turn() === 'w' ? 'White' : 'Black'
  if (chess.isCheckmate()) {
    return `Checkmate — ${toMove === 'White' ? 'Black' : 'White'} wins`
  }
  if (chess.isStalemate()) return 'Stalemate — draw'
  if (chess.isDraw()) return 'Draw'
  if (chess.isGameOver()) return 'Game over'
  return chess.isCheck() ? `${toMove} to move — check!` : `${toMove} to move`
}

export function Game() {
  const gameRef = useRef(new Chess())
  const chess = gameRef.current

  const [fen, setFen] = useState(chess.fen())
  const [lastMove, setLastMove] = useState(null)
  const [moveFrom, setMoveFrom] = useState('')
  const [moveOptions, setMoveOptions] = useState({})
  const [promotionMove, setPromotionMove] = useState(null)

  function clearSelection() {
    setMoveFrom('')
    setMoveOptions({})
  }

  function getMoveOptions(square) {
    const moves = chess.moves({ square, verbose: true })
    if (moves.length === 0) {
      setMoveOptions({})
      return false
    }
    const options = {}
    for (const move of moves) {
      options[move.to] = Boolean(move.captured)
    }
    setMoveOptions(options)
    return true
  }

  function commitMove(moveArg) {
    try {
      const result = chess.move(moveArg)
      setFen(chess.fen())
      setLastMove({ from: result.from, to: result.to })
      return true
    } catch {
      return false
    }
  }

  function onSquareClick({ square, piece }) {
    if (promotionMove) return

    if (!moveFrom) {
      if (!piece) return
      if (getMoveOptions(square)) setMoveFrom(square)
      return
    }

    if (square === moveFrom) {
      clearSelection()
      return
    }

    const candidates = chess
      .moves({ square: moveFrom, verbose: true })
      .filter((move) => move.to === square)

    if (candidates.length === 0) {
      if (piece) {
        setMoveFrom(getMoveOptions(square) ? square : '')
      } else {
        clearSelection()
      }
      return
    }

    if (candidates.some((move) => move.promotion)) {
      setPromotionMove({ sourceSquare: moveFrom, targetSquare: square, color: chess.turn() })
      clearSelection()
      return
    }

    commitMove({ from: moveFrom, to: square })
    clearSelection()
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
    if (!targetSquare) return false

    const candidates = chess
      .moves({ square: sourceSquare, verbose: true })
      .filter((move) => move.to === targetSquare)

    if (candidates.length === 0) return false

    if (candidates.some((move) => move.promotion)) {
      setPromotionMove({ sourceSquare, targetSquare, color: chess.turn() })
      clearSelection()
      // Accept the drop visually; the move is only finalised once a
      // promotion piece is chosen below.
      return true
    }

    const applied = commitMove({ from: sourceSquare, to: targetSquare })
    clearSelection()
    return applied
  }

  function onPromotionSelect(piece) {
    if (!promotionMove) return
    commitMove({
      from: promotionMove.sourceSquare,
      to: promotionMove.targetSquare,
      promotion: piece,
    })
    setPromotionMove(null)
  }

  function onPromotionCancel() {
    setPromotionMove(null)
  }

  function newGame() {
    gameRef.current = new Chess()
    setFen(gameRef.current.fen())
    setLastMove(null)
    setPromotionMove(null)
    clearSelection()
  }

  function buildSquareStyles() {
    const styles = {}

    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: isLightSquare(lastMove.from)
          ? 'var(--sq-light-hl)'
          : 'var(--sq-dark-hl)',
      }
      styles[lastMove.to] = {
        backgroundColor: isLightSquare(lastMove.to)
          ? 'var(--sq-light-hl)'
          : 'var(--sq-dark-hl)',
      }
    }

    for (const [square, isCapture] of Object.entries(moveOptions)) {
      styles[square] = isCapture
        ? {
            background:
              'radial-gradient(circle, transparent 60%, rgba(215,38,61,0.6) 60%, rgba(215,38,61,0.6) 76%, transparent 76%)',
          }
        : {
            background:
              'radial-gradient(circle, rgba(27,26,23,0.3) 30%, transparent 31%)',
          }
    }

    if (moveFrom) {
      styles[moveFrom] = { backgroundColor: 'var(--sq-selected)' }
    }

    return styles
  }

  const chessboardOptions = {
    id: 'chess-union-board',
    position: fen,
    onPieceDrop,
    onSquareClick,
    squareStyles: buildSquareStyles(),
    pieces: pieceRenderers,
    showNotation: true,
    darkSquareStyle: { backgroundColor: 'var(--sq-dark)' },
    lightSquareStyle: { backgroundColor: 'var(--sq-light)' },
    darkSquareNotationStyle: { color: 'var(--coord-on-dark)' },
    lightSquareNotationStyle: { color: 'var(--coord-on-light)' },
    boardStyle: { boxShadow: '0 0 0 3px var(--ink)' },
  }

  return (
    <div className="game">
      <p className="game-status" role="status">
        {statusText(chess)}
      </p>

      <div className="board-wrap">
        <Chessboard options={chessboardOptions} />
        {promotionMove ? (
          <PromotionPicker
            color={promotionMove.color}
            onSelect={onPromotionSelect}
            onCancel={onPromotionCancel}
          />
        ) : null}
      </div>

      <button type="button" className="new-game-button" onClick={newGame}>
        New game
      </button>
    </div>
  )
}
