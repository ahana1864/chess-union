import { Chess } from 'chess.js'
import { useRef, useState } from 'react'
import { applyMove, createUnionState, legalMoves } from '../lib/unionRules'

function matchesCandidate(candidate, moveArg) {
  if (typeof moveArg === 'string') {
    const plainSan = candidate.san.replace(/[+#]$/, '')
    return candidate.san === moveArg || plainSan === moveArg
  }
  if (candidate.from !== moveArg.from || candidate.to !== moveArg.to) return false
  return moveArg.promotion ? candidate.promotion === moveArg.promotion : true
}

function pluralTurns(n) {
  return `${n} turn${n === 1 ? '' : 's'}`
}

// Holds the chess.js game, the union state alongside it, and a snapshot
// stack for undo (the stack is kept up to date from step 3 on; an actual
// Undo button is P2, step 11).
export function useGame() {
  const chessRef = useRef(new Chess())
  const snapshotsRef = useRef([])

  const [fen, setFen] = useState(() => chessRef.current.fen())
  const [unions, setUnions] = useState(() => createUnionState())
  const [news, setNews] = useState(() => [])
  const [currentMoves, setCurrentMoves] = useState(
    () => legalMoves(chessRef.current, unions).moves,
  )

  // Re-derives the union-filtered legal moves for the resulting position,
  // resolving a strike-break if the filter would otherwise leave no moves
  // at all, then pushes everything into React state in one go.
  function settle(chess, nextUnions, nextNews) {
    const result = legalMoves(chess, nextUnions)
    const finalUnions = result.news.length > 0 ? result.unions : nextUnions
    const finalNews = result.news.length > 0 ? [...result.news, ...nextNews] : nextNews

    setFen(chess.fen())
    setUnions(finalUnions)
    setNews(finalNews)
    setCurrentMoves(result.moves)
  }

  // Why a square with a piece on it has no (or fewer) move options than
  // chess.js alone would allow — null if the piece isn't blocked by a union.
  function describeBlockedSquare(square) {
    const chess = chessRef.current
    const piece = chess.get(square)
    if (!piece) return null

    const rawMoves = chess.moves({ square, verbose: true })
    if (rawMoves.length === 0) return null

    const stillAllowed = currentMoves.some((move) => move.from === square)
    if (stillAllowed) return null

    const side = chess.turn() === 'w' ? 'white' : 'black'
    const pawns = unions[side].pawns
    if (piece.type === 'p' && pawns.status === 'strike') {
      return `Pawns are on strike (${pluralTurns(pawns.turnsLeft)} left)`
    }
    return 'That piece is sitting out right now.'
  }

  // Only ever called with moves drawn from currentMoves, so this should not
  // normally fail; the guard is a defensive no-op otherwise.
  function makeMove(moveArg) {
    const chess = chessRef.current
    const allowed = currentMoves.some((candidate) => matchesCandidate(candidate, moveArg))
    if (!allowed) return false

    snapshotsRef.current.push({ fen: chess.fen(), unions })

    const next = applyMove({ chess, unions, news }, moveArg)
    settle(next.chess, next.unions, next.news)
    return true
  }

  function newGame() {
    chessRef.current = new Chess()
    snapshotsRef.current = []
    settle(chessRef.current, createUnionState(), [])
  }

  return {
    chess: chessRef.current,
    fen,
    unions,
    news,
    currentMoves,
    makeMove,
    newGame,
    describeBlockedSquare,
  }
}
