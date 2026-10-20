import { Chess } from 'chess.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import { DEMO_CASES, DEMO_END_CARD } from '../lib/demoScript'
import { DEMO_TIMELINE } from '../lib/demoTimeline'
import { bannerContentFor } from '../lib/bannerContent'
import { restrictedSquares, sideHasBishop } from '../lib/boardInfo'
import { buildPieceRenderers } from './pieceRenderers'
import { UnionPanel } from './UnionPanel'
import { StrikeBanner } from './StrikeBanner'
import { NewsFeed } from './NewsFeed'
import { useGlyphOffsets } from '../hooks/useGlyphOffsets'

const CASE_COUNT = DEMO_CASES.length

// Plays the scripted demo: a single index walks DEMO_TIMELINE (precomputed
// once from the real engine -- see demoScript.js / demoRunner.js), each
// frame held for its own delayMs before auto-advancing. index === timeline
// length means "finished", which shows the end card instead of a board.
export function DemoGame({ onExit }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const advanceTimeoutRef = useRef(null)
  const boardWrapRef = useRef(null)
  const glyphOffsets = useGlyphOffsets(boardWrapRef)

  const finished = index >= DEMO_TIMELINE.length
  const item = finished ? null : DEMO_TIMELINE[index]
  const demoCase = item ? DEMO_CASES[item.caseIndex] : null

  useEffect(() => {
    if (!playing || finished) return
    const timeout = setTimeout(() => {
      setIndex((current) => Math.min(current + 1, DEMO_TIMELINE.length))
    }, item.delayMs)
    advanceTimeoutRef.current = timeout
    return () => clearTimeout(timeout)
  }, [playing, finished, index, item])

  const chess = useMemo(() => (item ? new Chess(item.frame.fen) : null), [item])

  const bannerEvent = item?.frame.news.find(
    (event) => event.type === 'strike' || event.type === 'strike-break',
  )
  const banner = bannerEvent ? bannerContentFor(bannerEvent, item.frame.unions) : null
  const blockedMessage = item?.frame.kind === 'blocked-attempt' ? item.frame.message : null
  const shakingSquare = item?.frame.kind === 'blocked-attempt' ? item.frame.blockedSquare : null

  // The news feed accumulates within the current case only (newest first),
  // same shape as the live game's feed, so each case starts with a clean
  // slate instead of carrying the previous case's headlines along.
  const newsSoFar = item
    ? DEMO_TIMELINE.slice(0, index + 1)
        .filter((entry) => entry.caseIndex === item.caseIndex)
        .flatMap((entry) => entry.frame.news)
        .reverse()
    : []

  const hasBishop = chess
    ? { white: sideHasBishop(chess, 'white'), black: sideHasBishop(chess, 'black') }
    : { white: true, black: true }
  const restrictedSet = chess
    ? new Set([
        ...restrictedSquares(chess, item.frame.unions, 'white'),
        ...restrictedSquares(chess, item.frame.unions, 'black'),
      ])
    : new Set()

  function togglePlaying() {
    setPlaying((value) => !value)
  }

  function skipCase() {
    if (finished || !item) return
    clearTimeout(advanceTimeoutRef.current)
    const nextCaseStart = DEMO_TIMELINE.findIndex((entry) => entry.caseIndex > item.caseIndex)
    setIndex(nextCaseStart === -1 ? DEMO_TIMELINE.length : nextCaseStart)
    setPlaying(true)
  }

  if (finished) {
    return (
      <div className="demo-end-card-screen">
        <div className="demo-end-card">
          <h1 className="wordmark">{DEMO_END_CARD.title}</h1>
          <p className="demo-end-caption">{DEMO_END_CARD.caption}</p>
          <button type="button" className="header-button header-button-solid" onClick={onExit}>
            Back to start
          </button>
        </div>
      </div>
    )
  }

  const chessboardOptions = {
    id: 'chess-union-demo-board',
    position: item.frame.fen,
    boardOrientation: 'white',
    allowDragging: false,
    pieces: buildPieceRenderers(item.frame.unions, shakingSquare, glyphOffsets, restrictedSet),
    showNotation: true,
    darkSquareStyle: { backgroundColor: 'var(--sq-dark)' },
    lightSquareStyle: { backgroundColor: 'var(--sq-light)' },
    darkSquareNotationStyle: { color: 'var(--coord-on-dark)' },
    lightSquareNotationStyle: { color: 'var(--coord-on-light)' },
    boardStyle: { boxShadow: '0 0 0 3px var(--ink)' },
  }

  return (
    <div className="app-shell">
      <header className="app-header demo-header">
        <div className="logo-badge" aria-hidden="true">
          ♟
        </div>
        <div className="header-titles">
          <h1 className="wordmark">CHESS UNION</h1>
          <p className="tagline">Demo mode</p>
        </div>
        <div className="demo-progress" role="status">
          Case {item.caseIndex + 1} of {CASE_COUNT}: {demoCase.title}
        </div>
        <div className="header-actions">
          <button type="button" className="header-button header-button-outline" onClick={togglePlaying}>
            {playing ? 'Pause' : 'Resume'}
          </button>
          <button type="button" className="header-button header-button-outline" onClick={skipCase}>
            Skip case
          </button>
          <button type="button" className="header-button header-button-solid" onClick={onExit}>
            Exit demo
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="unions-column">
          <UnionPanel
            unions={item.frame.unions}
            sideToMove={chess.turn() === 'w' ? 'white' : 'black'}
            orientation="white"
            hasBishop={hasBishop}
          />
        </aside>

        <main className="board-column">
          <p className="demo-caption" role="status">
            {demoCase.caption}
          </p>

          <div className="board-wrap" ref={boardWrapRef}>
            {banner ? (
              <StrikeBanner title={banner.title} subtitle={banner.subtitle} icon={banner.icon} />
            ) : null}
            <Chessboard options={chessboardOptions} />
            {blockedMessage ? <div className="blocked-toast">{blockedMessage}</div> : null}
          </div>
        </main>

        <aside className="news-column">
          <NewsFeed news={newsSoFar} />
        </aside>
      </div>
    </div>
  )
}
