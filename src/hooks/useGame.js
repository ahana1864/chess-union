import { Chess } from 'chess.js'
import { useRef, useState } from 'react'
import { applyMove, createUnionState, legalMoves } from '../lib/unionRules'
import {
  describeBlockedMove as describeBlockedMoveFor,
  describeBlockedSquare as describeBlockedSquareFor,
} from '../lib/blockedMoves'

function matchesCandidate(candidate, moveArg) {
  if (typeof moveArg === 'string') {
    const plainSan = candidate.san.replace(/[+#]$/, '')
    return candidate.san === moveArg || plainSan === moveArg
  }
  if (candidate.from !== moveArg.from || candidate.to !== moveArg.to) return false
  return moveArg.promotion ? candidate.promotion === moveArg.promotion : true
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
    let finalUnions = nextUnions
    let finalNews = nextNews

    if (result.news.length > 0) {
      // A strike-break happens before the next move is played, so it's
      // tagged with the move about to happen.
      const moveNumber = chess.history().length + 1
      const stamped = result.news.map((event) => ({ ...event, moveNumber }))
      finalUnions = result.unions
      finalNews = [...stamped, ...nextNews]
    }

    setFen(chess.fen())
    setUnions(finalUnions)
    setNews(finalNews)
    setCurrentMoves(result.moves)
  }

  // Why a square with a piece on it has no move options at all (used when
  // the player first clicks/grabs it) — null if the piece isn't blocked by
  // a union. Why one specific move isn't allowed (used when the player has
  // a piece selected and tries a particular target square, e.g. a bishop
  // reaching past its work-to-rule limit while it still has other legal
  // moves) — null if that exact move is legal, or isn't a real chess move
  // at all. Both delegate to src/lib/blockedMoves.js, shared with the demo
  // player so a blocked move reads identically in both places.
  function describeBlockedSquare(square) {
    return describeBlockedSquareFor(chessRef.current, unions, currentMoves, square)
  }

  function describeBlockedMove(fromSquare, toSquare) {
    return describeBlockedMoveFor(chessRef.current, unions, currentMoves, fromSquare, toSquare)
  }

  // Only ever called with moves drawn from currentMoves, so this should not
  // normally fail; the guard is a defensive no-op otherwise.
  function makeMove(moveArg) {
    const chess = chessRef.current
    const allowed = currentMoves.some((candidate) => matchesCandidate(candidate, moveArg))
    if (!allowed) return false

    snapshotsRef.current.push({ fen: chess.fen(), unions })

    const previousNewsCount = news.length
    const next = applyMove({ chess, unions, news }, moveArg)
    const moveNumber = chess.history().length
    const newCount = next.news.length - previousNewsCount
    const stampedNews = next.news.map((event, index) =>
      index < newCount ? { ...event, moveNumber } : event,
    )
    settle(next.chess, next.unions, stampedNews)
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
    describeBlockedMove,
  }
}
