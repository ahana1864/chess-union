import { Chessboard } from 'react-chessboard'
import { useState } from 'react'
import { useGame } from '../hooks/useGame'
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

// Temporary, step 3 only: a plain-text readout of union state so the rules
// can be checked by hand before there's a real Union Panel (step 4).
function pawnDebugText(sideLabel, pawns) {
  const detail =
    pawns.status === 'strike' || pawns.status === 'cooldown'
      ? ` (${pawns.turnsLeft} turns left)`
      : ''
  return `${sideLabel} pawns: ${pawns.grievance} grievance, ${pawns.status}${detail}`
}

export function Game() {
  const game = useGame()
  const chess = game.chess

  const [lastMove, setLastMove] = useState(null)
  const [moveFrom, setMoveFrom] = useState('')
  const [moveOptions, setMoveOptions] = useState({})
  const [promotionMove, setPromotionMove] = useState(null)
  const [blockedMessage, setBlockedMessage] = useState(null)

  function clearSelection() {
    setMoveFrom('')
    setMoveOptions({})
  }

  function getMoveOptions(square) {
    const moves = game.currentMoves.filter((move) => move.from === square)
    if (moves.length === 0) {
      setMoveOptions({})
      setBlockedMessage(game.describeBlockedSquare(square))
      return false
    }
    setBlockedMessage(null)
    const options = {}
    for (const move of moves) {
      options[move.to] = Boolean(move.captured)
    }
    setMoveOptions(options)
    return true
  }

  function commitMove(moveArg) {
    const applied = game.makeMove(moveArg)
    if (applied) {
      setLastMove({ from: moveArg.from, to: moveArg.to })
      setBlockedMessage(null)
    }
    return applied
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

    const candidates = game.currentMoves.filter(
      (move) => move.from === moveFrom && move.to === square,
    )

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

    const candidates = game.currentMoves.filter(
      (move) => move.from === sourceSquare && move.to === targetSquare,
    )

    if (candidates.length === 0) {
      setBlockedMessage(game.describeBlockedSquare(sourceSquare))
      return false
    }

    if (candidates.some((move) => move.promotion)) {
      setPromotionMove({ sourceSquare, targetSquare, color: chess.turn() })
      clearSelection()
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
    game.newGame()
    setLastMove(null)
    setPromotionMove(null)
    setBlockedMessage(null)
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
    position: game.fen,
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

      {blockedMessage ? <p className="blocked-message">{blockedMessage}</p> : null}

      <p className="union-debug">
        {pawnDebugText('White', game.unions.white.pawns)}
        {' · '}
        {pawnDebugText('Black', game.unions.black.pawns)}
      </p>

      <button type="button" className="new-game-button" onClick={newGame}>
        New game
      </button>
    </div>
  )
}
