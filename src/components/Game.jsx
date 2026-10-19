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

const FILES = 'abcdefgh'
const BANNER_VISIBLE_MS = 2200
const BLOCKED_MESSAGE_MS = 2200
const SHAKE_MS = 250

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
  const game = useGame()
  const chess = game.chess

  const [lastMove, setLastMove] = useState(null)
  const [moveFrom, setMoveFrom] = useState('')
  const [moveOptions, setMoveOptions] = useState({})
  const [promotionMove, setPromotionMove] = useState(null)
  const [blockedMessage, setBlockedMessage] = useState(null)
  const [shakingSquare, setShakingSquare] = useState(null)
  const [banner, setBanner] = useState(null)

  const blockedTimeoutRef = useRef(null)
  const shakeTimeoutRef = useRef(null)
  const bannerTimeoutRef = useRef(null)
  const lastBannerEventRef = useRef(null)

  // Shows the strike / strike-break banner once per genuinely new event
  // (news is newest-first, so we only act when that first event changes),
  // then auto-dismisses it; the status chips and picket signs carry the
  // rest of the strike.
  useEffect(() => {
    const latest = game.news[0]
    if (!latest || latest === lastBannerEventRef.current) return
    lastBannerEventRef.current = latest
    if (latest.type !== 'strike' && latest.type !== 'strike-break') return

    const turnsLeft = game.unions[latest.side]?.[latest.union]?.turnsLeft ?? 0
    setBanner({ kind: latest.type, side: latest.side, union: latest.union, turnsLeft })

    clearTimeout(bannerTimeoutRef.current)
    bannerTimeoutRef.current = setTimeout(() => setBanner(null), BANNER_VISIBLE_MS)
  }, [game.news, game.unions])

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
    setBanner(null)
    lastBannerEventRef.current = null
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
    pieces: buildPieceRenderers(game.unions, shakingSquare),
    showNotation: true,
    darkSquareStyle: { backgroundColor: 'var(--sq-dark)' },
    lightSquareStyle: { backgroundColor: 'var(--sq-light)' },
    darkSquareNotationStyle: { color: 'var(--coord-on-dark)' },
    lightSquareNotationStyle: { color: 'var(--coord-on-light)' },
    boardStyle: { boxShadow: '0 0 0 3px var(--ink)' },
  }

  const sideToMove = chess.turn() === 'w' ? 'white' : 'black'

  return (
    <div className="app-shell">
      <Header onNewGame={newGame} />

      <div className="layout">
        <aside className="unions-column">
          <UnionPanel unions={game.unions} sideToMove={sideToMove} />
        </aside>

        <main className="board-column">
          <p className="game-status" role="status">
            {statusText(chess)}
          </p>

          <div className="board-wrap">
            {banner ? (
              <StrikeBanner
                kind={banner.kind}
                side={banner.side}
                union={banner.union}
                turnsLeft={banner.turnsLeft}
              />
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
        </main>

        <aside className="news-column">
          <NewsFeed news={game.news} />
          <MoveList history={chess.history()} />
        </aside>
      </div>
    </div>
  )
}
