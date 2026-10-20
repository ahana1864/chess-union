import { Chessboard } from 'react-chessboard'
import { useEffect, useRef, useState } from 'react'
import { useGame } from '../hooks/useGame'
import { buildPieceRenderers } from './pieceRenderers'
import { PromotionPicker } from './PromotionPicker'
import { UnionPanel } from './UnionPanel'
import { StrikeBanner } from './StrikeBanner'
import { NewsFeed } from './NewsFeed'
import { MoveList } from './MoveList'
import { Header } from './Header'
import { GameOverCard } from './GameOverCard'
import { statusText } from '../lib/statusText'
import { pickBotMove } from '../lib/bot'
import { getCapturedPieces } from '../lib/capturedPieces'
import { CapturedTray } from './CapturedTray'
import { restrictedSquares, sideHasBishop } from '../lib/boardInfo'
import { useGlyphOffsets } from '../hooks/useGlyphOffsets'
import { bannerContentFor } from '../lib/bannerContent'

const FILES = 'abcdefgh'
const BANNER_VISIBLE_MS = 2200
const BLOCKED_MESSAGE_MS = 2200
const SHAKE_MS = 250
const BOT_THINK_MS = 600

function sideLabel(side) {
  return side === 'white' ? 'White' : 'Black'
}

function isLightSquare(square) {
  const file = FILES.indexOf(square[0])
  const rank = Number(square[1]) - 1
  return (file + rank) % 2 === 1
}

export function Game({ config, onReturnToStart, onShowRules }) {
  const game = useGame()
  const chess = game.chess

  const [lastMove, setLastMove] = useState(null)
  const [moveFrom, setMoveFrom] = useState('')
  const [moveOptions, setMoveOptions] = useState({})
  const [promotionMove, setPromotionMove] = useState(null)
  const [blockedMessage, setBlockedMessage] = useState(null)
  const [shakingSquare, setShakingSquare] = useState(null)
  const [banner, setBanner] = useState(null)
  const [bannerQueue, setBannerQueue] = useState([])
  const [botThinking, setBotThinking] = useState(false)

  const blockedTimeoutRef = useRef(null)
  const shakeTimeoutRef = useRef(null)
  const bannerTimeoutRef = useRef(null)
  const lastNewsLengthRef = useRef(0)
  const boardWrapRef = useRef(null)
  const glyphOffsets = useGlyphOffsets(boardWrapRef)

  // Vs bot: the bot plays whichever side the human didn't pick.
  const botSide = config?.mode === 'vs-bot' ? (config.side === 'white' ? 'black' : 'white') : null
  const sideToMove = chess.turn() === 'w' ? 'white' : 'black'
  const isBotTurn = botSide !== null && botSide === sideToMove

  // Plays the bot's move after a short "thinking" delay once it's the
  // bot's turn. Reads game.currentMoves fresh each time this fires, so it
  // always picks from the same union-filtered list the human plays from —
  // the bot's own unions strike too, it just never sees a struck piece's
  // move as an option.
  useEffect(() => {
    if (!isBotTurn || chess.isGameOver()) return

    setBotThinking(true)
    const timeout = setTimeout(() => {
      const move = pickBotMove(chess, game.currentMoves, { mode: 'greedy' })
      if (move) {
        game.makeMove({ from: move.from, to: move.to, promotion: move.promotion })
        setLastMove({ from: move.from, to: move.to })
      }
      setBotThinking(false)
    }, BOT_THINK_MS)

    return () => {
      clearTimeout(timeout)
      setBotThinking(false)
    }
    // `game` is a new object every render and `chess` is a stable ref, so
    // listing them (as the linter suggests) would either restart this
    // timer on every unrelated re-render or do nothing — game.fen and
    // game.currentMoves are what actually need to trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBotTurn, game.fen, game.currentMoves])

  // Queues a banner for every genuinely new strike / work-to-rule / sit-out
  // event (news is newest-first; we diff against the length we last saw so
  // a single move that trips more than one union at once -- e.g. a quiet
  // rook move that both completes a pawn's grievance and extends the rook
  // streak -- queues all of them instead of only the first). Strike-break
  // only gets a banner for pawns; see bannerContent.js.
  useEffect(() => {
    const newCount = game.news.length - lastNewsLengthRef.current
    lastNewsLengthRef.current = game.news.length
    if (newCount <= 0) return

    const newEvents = game.news.slice(0, newCount)
    const items = newEvents
      .filter(
        (event) =>
          event.type === 'strike' || (event.type === 'strike-break' && event.union === 'pawns'),
      )
      .reverse()
      .map((event) => bannerContentFor(event, game.unions))

    if (items.length > 0) setBannerQueue((queue) => [...queue, ...items])
  }, [game.news, game.unions])

  // Shows the next queued banner once the current one has cleared, so
  // multiple banners from the same move display one after another instead
  // of stepping on each other.
  useEffect(() => {
    if (banner || bannerQueue.length === 0) return

    const [next, ...rest] = bannerQueue
    setBanner(next)
    setBannerQueue(rest)

    clearTimeout(bannerTimeoutRef.current)
    bannerTimeoutRef.current = setTimeout(() => setBanner(null), BANNER_VISIBLE_MS)
  }, [banner, bannerQueue])

  useEffect(
    () => () => {
      clearTimeout(blockedTimeoutRef.current)
      clearTimeout(shakeTimeoutRef.current)
      clearTimeout(bannerTimeoutRef.current)
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
      setLastMove({ from: moveArg.from, to: moveArg.to })
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
      const blockedReason = game.describeBlockedMove(moveFrom, square)
      if (blockedReason) {
        showBlocked(moveFrom, blockedReason)
        return
      }
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
      const message =
        game.describeBlockedMove(sourceSquare, targetSquare) ??
        game.describeBlockedSquare(sourceSquare)
      showBlocked(sourceSquare, message)
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

  const orientation = config?.side === 'black' ? 'black' : 'white'
  const topSide = orientation === 'white' ? 'black' : 'white'
  const bottomSide = orientation
  const { byWhite, byBlack } = getCapturedPieces(chess)
  const trayFor = (side) => (side === 'white' ? byWhite : byBlack)
  const capturedColorFor = (side) => (side === 'white' ? 'black' : 'white')
  const hasBishop = { white: sideHasBishop(chess, 'white'), black: sideHasBishop(chess, 'black') }
  const restrictedSet = new Set([
    ...restrictedSquares(chess, game.unions, 'white'),
    ...restrictedSquares(chess, game.unions, 'black'),
  ])

  const chessboardOptions = {
    id: 'chess-union-board',
    position: game.fen,
    boardOrientation: orientation,
    allowDragging: !isBotTurn,
    onPieceDrop,
    onSquareClick,
    squareStyles: buildSquareStyles(),
    pieces: buildPieceRenderers(game.unions, shakingSquare, glyphOffsets, restrictedSet),
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
          <UnionPanel
            unions={game.unions}
            sideToMove={sideToMove}
            orientation={orientation}
            hasBishop={hasBishop}
          />
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
            {banner ? (
              <StrikeBanner title={banner.title} subtitle={banner.subtitle} icon={banner.icon} />
            ) : null}
            <Chessboard options={chessboardOptions} />
            {promotionMove ? (
              <PromotionPicker
                color={promotionMove.color}
                onSelect={onPromotionSelect}
                onCancel={onPromotionCancel}
              />
            ) : null}
            {blockedMessage ? <div className="blocked-toast">{blockedMessage}</div> : null}
          </div>

          <div className="player-bar">
            <CapturedTray capturedColor={capturedColorFor(bottomSide)} pieces={trayFor(bottomSide)} />
          </div>
        </main>

        <aside className="news-column">
          <NewsFeed news={game.news} />
          <MoveList history={chess.history()} />
        </aside>
      </div>

      {chess.isGameOver() ? (
        <GameOverCard chess={chess} onNewGame={onReturnToStart} />
      ) : null}
    </div>
  )
}
