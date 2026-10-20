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
// behaviour never change. randomizeColors ('w'/'b', both by default) is
// passed straight to createChaosState -- pass just the human's color to
// leave the bot's own pieces personality-free (see Chaos vs bot in
// ChaosGame.jsx).
export function useChaosGame(seed, randomizeColors) {
  const chessRef = useRef(new Chess())
  const [fen, setFen] = useState(() => chessRef.current.fen())
  const [chaos, setChaos] = useState(() => createChaosState(chessRef.current, seed, randomizeColors))
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
    settle(chessRef.current, createChaosState(chessRef.current, nextSeed ?? seed, randomizeColors), [])
  }

  // For the bot: asks chooseMove(chess, moves) for a move, applies it, and
  // if the chosen piece refuses, drops every move from that same square and
  // asks again -- so one furious piece can never stall the bot's whole
  // turn. Works against local chess/chaos/news rather than makeMove's own
  // (chaos, news) closures, since several attempts can happen in one call,
  // before React has re-rendered with the first attempt's state. Returns
  // the applied {from, to}, or null if every candidate piece refused (rare;
  // the caller should just try again on a later tick).
  function makeBotMove(chooseMove) {
    const chess = chessRef.current
    let localChaos = chaos
    let localNews = news
    let remaining = currentMoves

    while (remaining.length > 0) {
      const move = chooseMove(chess, remaining)
      if (!move) break

      const next = applyChaosMove({ chess, chaos: localChaos, news: localNews }, move)

      if (next.refused) {
        localChaos = next.chaos
        localNews = next.news
        remaining = remaining.filter((candidate) => candidate.from !== move.from)
        continue
      }

      const moveNumber = chess.history().length
      const newCount = next.news.length - localNews.length
      const stampedNews = next.news.map((event, index) =>
        index < newCount ? { ...event, moveNumber } : event,
      )
      setRefusal(null)
      settle(next.chess, next.chaos, stampedNews)
      return next.appliedMove
    }

    // Every legal move's piece refused this attempt: commit the rolls (rng
    // advanced, refusal news recorded) without ending the turn.
    setChaos(localChaos)
    setNews(localNews)
    return null
  }

  return {
    chess: chessRef.current,
    fen,
    chaos,
    news,
    currentMoves,
    refusal,
    makeMove,
    makeBotMove,
    newGame,
    describeBlockedSquare,
  }
}
