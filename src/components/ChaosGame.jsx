import { Chessboard } from 'react-chessboard'
import { useEffect, useRef, useState } from 'react'
import { useChaosGame } from '../hooks/useChaosGame'
import { buildChaosPieceRenderers } from './chaosPieceRenderers'
import { PromotionPicker } from './PromotionPicker'
import { ChaosLegend } from './ChaosLegend'
import { ChaosNewsFeed } from './ChaosNewsFeed'
import { MoveList } from './MoveList'
import { Header } from './Header'
import { GameOverCard } from './GameOverCard'
import { statusText } from '../lib/statusText'
import { getCapturedPieces } from '../lib/capturedPieces'
import { CapturedTray } from './CapturedTray'
import { useGlyphOffsets } from '../hooks/useGlyphOffsets'
import { pickBotMove } from '../lib/bot'

// Chaos Mode's equivalent of Game.jsx: same board-interaction shape
// (click/drag, promotion, blocked-move toast), but wired to useChaosGame
// instead of useGame, and with the union panel/strike banner swapped for a
// static legend and a speech bubble for refusals. Kept as its own
// component, not a branch inside Game.jsx, so classic mode's component
// never changes.
const FILES = 'abcdefgh'
const BLOCKED_MESSAGE_MS = 2200
const SHAKE_MS = 250
const REFUSAL_MS = 2200
const BOT_THINK_MS = 600
const BOT_RETRY_MS = 300

function isLightSquare(square) {
  const file = FILES.indexOf(square[0])
  const rank = Number(square[1]) - 1
  return (file + rank) % 2 === 1
}

function sideLabel(side) {
  return side === 'white' ? 'White' : 'Black'
}

export function ChaosGame({ config, onReturnToStart, onShowRules }) {
  // Vs bot: the bot plays whichever side the human didn't pick, and -- per
  // request -- doesn't get randomized personalities itself, only the
  // human's side does. In two-player mode both sides are randomized.
  const botSide = config?.mode === 'vs-bot' ? (config.side === 'white' ? 'black' : 'white') : null
  const randomizeColors = botSide === 'white' ? ['b'] : botSide === 'black' ? ['w'] : ['w', 'b']

  const game = useChaosGame(config?.seed, randomizeColors)
  const chess = game.chess

  const [lastMove, setLastMove] = useState(null)
  const [moveFrom, setMoveFrom] = useState('')
  const [moveOptions, setMoveOptions] = useState({})
  const [promotionMove, setPromotionMove] = useState(null)
  const [blockedMessage, setBlockedMessage] = useState(null)
  const [shakingSquare, setShakingSquare] = useState(null)
  const [refusalSquare, setRefusalSquare] = useState(null)
  const [botThinking, setBotThinking] = useState(false)
  const [botRetryTick, setBotRetryTick] = useState(0)

  const blockedTimeoutRef = useRef(null)
  const shakeTimeoutRef = useRef(null)
  const refusalTimeoutRef = useRef(null)
  const botTimeoutRef = useRef(null)
  const boardWrapRef = useRef(null)
  const glyphOffsets = useGlyphOffsets(boardWrapRef)

  const sideToMove = chess.turn() === 'w' ? 'white' : 'black'
  const isBotTurn = botSide !== null && botSide === sideToMove

  // Plays the bot's move after a short "thinking" delay. Uses makeBotMove
  // (not makeMove) so a furious piece refusing doesn't stall the bot: it
  // automatically tries a different piece instead. In the rare case every
  // legal mover refuses on the same attempt, applied comes back null and
  // botRetryTick bumps to try again shortly -- game.fen/currentMoves alone
  // wouldn't change from a refusal, so this effect needs its own nudge to
  // re-fire.
  useEffect(() => {
    if (!isBotTurn || chess.isGameOver()) return

    setBotThinking(true)
    const timeout = setTimeout(() => {
      const applied = game.makeBotMove((currentChess, moves) =>
        pickBotMove(currentChess, moves, { mode: 'greedy' }),
      )
      if (applied) {
        setLastMove({ from: applied.from, to: applied.to })
        setBotThinking(false)
      } else {
        botTimeoutRef.current = setTimeout(() => setBotRetryTick((tick) => tick + 1), BOT_RETRY_MS)
      }
    }, BOT_THINK_MS)

    return () => {
      clearTimeout(timeout)
      clearTimeout(botTimeoutRef.current)
      setBotThinking(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBotTurn, game.fen, game.currentMoves, botRetryTick])

  useEffect(() => {
    if (!game.refusal) return
    setRefusalSquare(game.refusal.square)
    setBlockedMessage(`That piece refuses to move. Try again, or try something else.`)
    clearTimeout(refusalTimeoutRef.current)
    refusalTimeoutRef.current = setTimeout(() => {
      setRefusalSquare(null)
      setBlockedMessage(null)
    }, REFUSAL_MS)
  }, [game.refusal])

  useEffect(
    () => () => {
      clearTimeout(blockedTimeoutRef.current)
      clearTimeout(shakeTimeoutRef.current)
      clearTimeout(refusalTimeoutRef.current)
      clearTimeout(botTimeoutRef.current)
    },
    [],
  )

  function clearSelection() {
    setMoveFrom('')
    setMoveOptions({})
  }

  function showBlocked(square, message) {
    if (!message) return
    setBlockedMessage(message)
    setShakingSquare(square)

    clearTimeout(blockedTimeoutRef.current)
    blockedTimeoutRef.current = setTimeout(() => setBlockedMessage(null), BLOCKED_MESSAGE_MS)
    clearTimeout(shakeTimeoutRef.current)
    shakeTimeoutRef.current = setTimeout(() => setShakingSquare(null), SHAKE_MS)
  }

  function getMoveOptions(square) {
    const moves = game.currentMoves.filter((move) => move.from === square)
    if (moves.length === 0) {
      setMoveOptions({})
      showBlocked(square, game.describeBlockedSquare(square))
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
      setLastMove({ from: applied.from, to: applied.to })
      setBlockedMessage(null)
    }
    return applied
  }

  function onSquareClick({ square, piece }) {
    if (promotionMove || isBotTurn) return

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
    if (!targetSquare || isBotTurn) return false

    const candidates = game.currentMoves.filter(
      (move) => move.from === sourceSquare && move.to === targetSquare,
    )

    if (candidates.length === 0) {
      showBlocked(sourceSquare, game.describeBlockedSquare(sourceSquare))
      return false
    }

    if (candidates.some((move) => move.promotion)) {
      setPromotionMove({ sourceSquare, targetSquare, color: chess.turn() })
      clearSelection()
      return true
    }

    const applied = commitMove({ from: sourceSquare, to: targetSquare })
    clearSelection()
    return Boolean(applied)
  }

  function onPromotionSelect(piece) {
    if (!promotionMove) return
    commitMove({ from: promotionMove.sourceSquare, to: promotionMove.targetSquare, promotion: piece })
    setPromotionMove(null)
  }

  function onPromotionCancel() {
    setPromotionMove(null)
  }

  function buildSquareStyles() {
    const styles = {}

    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: isLightSquare(lastMove.from) ? 'var(--sq-light-hl)' : 'var(--sq-dark-hl)',
      }
      styles[lastMove.to] = {
        backgroundColor: isLightSquare(lastMove.to) ? 'var(--sq-light-hl)' : 'var(--sq-dark-hl)',
      }
    }

    for (const [square, isCapture] of Object.entries(moveOptions)) {
      styles[square] = isCapture
        ? {
            background:
              'radial-gradient(circle, transparent 60%, rgba(215,38,61,0.6) 60%, rgba(215,38,61,0.6) 76%, transparent 76%)',
          }
        : { background: 'radial-gradient(circle, rgba(27,26,23,0.3) 30%, transparent 31%)' }
    }

    if (moveFrom) {
      styles[moveFrom] = { backgroundColor: 'var(--sq-selected)' }
    }

    return styles
  }

  const orientation = config?.side === 'black' ? 'black' : 'white'
  const topSide = orientation === 'white' ? 'black' : 'white'
  const bottomSide = orientation
  const { byWhite, byBlack } = getCapturedPieces(chess)
  const trayFor = (side) => (side === 'white' ? byWhite : byBlack)
  const capturedColorFor = (side) => (side === 'white' ? 'black' : 'white')

  const chessboardOptions = {
    id: 'chess-union-chaos-board',
    position: game.fen,
    boardOrientation: orientation,
    allowDragging: !isBotTurn,
    onPieceDrop,
    onSquareClick,
    squareStyles: buildSquareStyles(),
    pieces: buildChaosPieceRenderers(game.chaos, shakingSquare, glyphOffsets, refusalSquare),
    showNotation: true,
    darkSquareStyle: { backgroundColor: 'var(--sq-dark)' },
    lightSquareStyle: { backgroundColor: 'var(--sq-light)' },
    darkSquareNotationStyle: { color: 'var(--coord-on-dark)' },
    lightSquareNotationStyle: { color: 'var(--coord-on-light)' },
    boardStyle: { boxShadow: '0 0 0 3px var(--ink)' },
  }

  return (
    <div className="app-shell">
      <Header onNewGame={onReturnToStart} onShowRules={onShowRules} />

      <div className="layout">
        <aside className="unions-column">
          <ChaosLegend botSide={botSide} />
        </aside>

        <main className="board-column">
          <p className="game-status" role="status">
            {statusText(chess)}
          </p>
          {botThinking ? (
            <p className="bot-thinking" role="status">
              {sideLabel(botSide)} is thinking…
            </p>
          ) : null}

          <div className="player-bar">
            <CapturedTray capturedColor={capturedColorFor(topSide)} pieces={trayFor(topSide)} />
          </div>

          <div className="board-wrap" ref={boardWrapRef}>
            <Chessboard options={chessboardOptions} />
            {promotionMove ? (
              <PromotionPicker color={promotionMove.color} onSelect={onPromotionSelect} onCancel={onPromotionCancel} />
            ) : null}
            {blockedMessage ? <div className="blocked-toast">{blockedMessage}</div> : null}
          </div>

          <div className="player-bar">
            <CapturedTray capturedColor={capturedColorFor(bottomSide)} pieces={trayFor(bottomSide)} />
          </div>
        </main>

        <aside className="news-column">
          <ChaosNewsFeed news={game.news} />
          <MoveList history={chess.history()} />
        </aside>
      </div>

      {chess.isGameOver() ? <GameOverCard chess={chess} onNewGame={onReturnToStart} /> : null}
    </div>
  )
}
