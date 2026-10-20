import { Chess } from 'chess.js'
import { useRef, useState } from 'react'
import {
  applyChaosMove,
  chaosLegalMoves,
  createChaosState,
  describeChaosBlockedSquare,
  matchesCandidate,
} from '../lib/chaos/chaosEngine'

// Chaos Mode's equivalent of useGame.js: holds the chess.js game and the
// chaos (per-piece personality/fatigue/grievance/anger) state alongside it.
// A separate hook, not a variant of useGame, so classic mode's file and
// behaviour never change.
export function useChaosGame(seed) {
  const chessRef = useRef(new Chess())
  const [fen, setFen] = useState(() => chessRef.current.fen())
  const [chaos, setChaos] = useState(() => createChaosState(chessRef.current, seed))
  const [news, setNews] = useState(() => [])
  const [currentMoves, setCurrentMoves] = useState(
    () => chaosLegalMoves(chessRef.current, chaos).moves,
  )
  // The square whose piece just refused to move, if any, so the UI can
  // show a speech bubble there -- cleared on the next successful move.
  const [refusal, setRefusal] = useState(null)

  function settle(chess, nextChaos, nextNews) {
    const result = chaosLegalMoves(chess, nextChaos)
    let finalChaos = nextChaos
    let finalNews = nextNews

    if (result.news.length > 0) {
      const moveNumber = chess.history().length + 1
      const stamped = result.news.map((event) => ({ ...event, moveNumber }))
      finalChaos = result.chaos
      finalNews = [...stamped, ...nextNews]
    }

    setFen(chess.fen())
    setChaos(finalChaos)
    setNews(finalNews)
    setCurrentMoves(result.moves)
  }

  function describeBlockedSquare(square) {
    return describeChaosBlockedSquare(chessRef.current, chaos, currentMoves, square)
  }

  // Returns false if the move was invalid or a furious piece refused it
  // outright (the refusal is still recorded, for the speech bubble/news),
  // or the applied {from, to} if it went through -- which may differ from
  // moveArg if the piece went rogue and picked its own target instead.
  function makeMove(moveArg) {
    const chess = chessRef.current
    const candidate = currentMoves.find((move) => matchesCandidate(move, moveArg))
    if (!candidate) return false

    const previousNewsCount = news.length
    const next = applyChaosMove({ chess, chaos, news }, moveArg)

    if (next.refused) {
      const moveNumber = chess.history().length + 1
      const newCount = next.news.length - previousNewsCount
      const stampedNews = next.news.map((event, index) =>
        index < newCount ? { ...event, moveNumber } : event,
      )
      setChaos(next.chaos)
      setNews(stampedNews)
      setRefusal({ square: candidate.from, pieceType: candidate.piece })
      return false
    }

    setRefusal(null)
    const moveNumber = chess.history().length
    const newCount = next.news.length - previousNewsCount
    const stampedNews = next.news.map((event, index) =>
      index < newCount ? { ...event, moveNumber } : event,
    )

    settle(next.chess, next.chaos, stampedNews)
    return next.appliedMove
  }

  function newGame(nextSeed) {
    chessRef.current = new Chess()
    setRefusal(null)
    settle(chessRef.current, createChaosState(chessRef.current, nextSeed ?? seed), [])
  }

  return {
    chess: chessRef.current,
    fen,
    chaos,
    news,
    currentMoves,
    refusal,
    makeMove,
    newGame,
    describeBlockedSquare,
  }
}
