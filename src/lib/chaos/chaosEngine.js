// Chaos Mode's rules engine: per-piece fatigue/grievance/anger instead of
// classic mode's per-union grievance. Deliberately a separate, self-
// contained engine (own piece-identity tracking, own thresholds) rather
// than a variant of unionRules.js, so classic mode's files never change.
import { CHAOS_CONFIG, PERSONALITIES, PERSONALITY_KEYS } from './chaosConfig'
import { hashSeed, nextRandom, randomInt } from './seededRandom'

const FILES = 'abcdefgh'

function isAdjacent(a, b) {
  if (a === b) return false
  const fileDelta = Math.abs(FILES.indexOf(a[0]) - FILES.indexOf(b[0]))
  const rankDelta = Math.abs(Number(a[1]) - Number(b[1]))
  return fileDelta <= 1 && rankDelta <= 1
}

// Rounded, but never 0 for a positive base -- otherwise a multiplier under
// ~0.5 would stall that stat forever for the slowest personalities.
function scaled(base, multiplier) {
  return Math.max(1, Math.round(base * multiplier))
}

function squareForEnPassantVictim(move) {
  return move.to[0] + move.from[1]
}

export function matchesCandidate(candidate, moveArg) {
  if (typeof moveArg === 'string') {
    const plainSan = candidate.san.replace(/[+#]$/, '')
    return candidate.san === moveArg || plainSan === moveArg
  }
  if (candidate.from !== moveArg.from || candidate.to !== moveArg.to) return false
  return moveArg.promotion ? candidate.promotion === moveArg.promotion : true
}

function createPiece(id, cell, personality) {
  return {
    id,
    type: cell.type,
    color: cell.color,
    square: cell.square,
    personality,
    fatigue: 0,
    grievance: 0,
    anger: 0,
    status: 'calm', // 'calm' | 'sleeping' | 'striking' | 'rebel'
    sleepTurnsLeft: 0,
    strikeTurnsLeft: 0,
  }
}

// Assigns every piece on the board a stable id and a random personality,
// walking the board in chess.js's own (fixed) rank/file order so the same
// seed always hands out the same personalities in the same order.
export function createChaosState(chess, seed) {
  let rngState = hashSeed(seed)
  const piecesById = {}
  const bySquare = {}
  let nextId = 0

  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue
      const pick = randomInt(rngState, PERSONALITY_KEYS.length)
      rngState = pick.state
      const id = `piece-${nextId++}`
      piecesById[id] = createPiece(id, cell, PERSONALITY_KEYS[pick.value])
      bySquare[cell.square] = id
    }
  }

  return {
    piecesById,
    bySquare,
    rngState,
    pendingUnpaidLoss: { white: null, black: null },
  }
}

function isBlocked(pieceId, chaos) {
  const piece = pieceId ? chaos.piecesById[pieceId] : null
  return piece ? piece.status === 'sleeping' || piece.status === 'striking' : false
}

// Union-filtered moves, chaos-mode version: sleeping/striking pieces can't
// be the "from" of a move. If that would leave the side with zero legal
// moves while chess.js still has some, every blocking piece of that side
// snaps out of it immediately (same escape hatch as unionRules.js's
// strike-break) so checkmate/stalemate detection is never short-circuited.
export function chaosLegalMoves(chess, chaos) {
  const side = chess.turn() === 'w' ? 'white' : 'black'
  const color = chess.turn()
  const allMoves = chess.moves({ verbose: true })
  if (allMoves.length === 0) return { moves: [], chaos, news: [] }

  const permitted = allMoves.filter((move) => !isBlocked(chaos.bySquare[move.from], chaos))
  if (permitted.length > 0) return { moves: permitted, chaos, news: [] }

  const news = []
  const piecesById = { ...chaos.piecesById }
  for (const [id, piece] of Object.entries(chaos.piecesById)) {
    if (piece.color !== color) continue
    if (piece.status !== 'sleeping' && piece.status !== 'striking') continue
    piecesById[id] = {
      ...piece,
      status: 'calm',
      sleepTurnsLeft: 0,
      strikeTurnsLeft: 0,
      fatigue: 0,
      grievance: 0,
    }
    news.push({
      type: 'chaos-strike-break',
      side,
      square: piece.square,
      pieceType: piece.type,
      personality: piece.personality,
    })
  }

  return { moves: allMoves, chaos: { ...chaos, piecesById }, news }
}

function recomputeStatus(piece) {
  if (piece.sleepTurnsLeft > 0) return 'sleeping'
  if (piece.strikeTurnsLeft > 0) return 'striking'
  if (piece.anger >= CHAOS_CONFIG.furiousThreshold) return 'rebel'
  return 'calm'
}

// Moves the mover's (and, for castling, the rook's) piece identity, and
// drops the captured piece's identity -- including the en passant victim,
// which sits on a different square than the move's own "to".
function trackMove(chaos, move) {
  let piecesById = chaos.piecesById
  let bySquare = chaos.bySquare

  if (move.captured) {
    const capturedSquare = move.flags.includes('e') ? squareForEnPassantVictim(move) : move.to
    const capturedId = bySquare[capturedSquare]
    if (capturedId) {
      piecesById = { ...piecesById }
      delete piecesById[capturedId]
      bySquare = { ...bySquare }
      delete bySquare[capturedSquare]
    }
  }

  const moverId = bySquare[move.from]
  if (moverId) {
    bySquare = { ...bySquare }
    delete bySquare[move.from]
    bySquare[move.to] = moverId
    piecesById = {
      ...piecesById,
      [moverId]: {
        ...piecesById[moverId],
        square: move.to,
        type: move.promotion ?? piecesById[moverId].type,
      },
    }
  }

  if (move.flags.includes('k') || move.flags.includes('q')) {
    const rank = move.color === 'w' ? '1' : '8'
    const kingside = move.flags.includes('k')
    const rookFrom = `${kingside ? 'h' : 'a'}${rank}`
    const rookTo = `${kingside ? 'f' : 'd'}${rank}`
    const rookId = bySquare[rookFrom]
    if (rookId) {
      bySquare = { ...bySquare }
      delete bySquare[rookFrom]
      bySquare[rookTo] = rookId
      piecesById = { ...piecesById, [rookId]: { ...piecesById[rookId], square: rookTo } }
    }
  }

  return { ...chaos, piecesById, bySquare }
}

// A side just lost a piece unpaid: every piece of that side adjacent to the
// square it was lost on grows grievance and anger.
function resolvePendingLoss(chaos, moverLabel, moverColor, isCapture, news) {
  const square = chaos.pendingUnpaidLoss[moverLabel]
  if (!square) return chaos

  let piecesById = chaos.piecesById
  if (!isCapture) {
    piecesById = { ...piecesById }
    for (const [id, piece] of Object.entries(piecesById)) {
      if (piece.color !== moverColor || !isAdjacent(piece.square, square)) continue
      const mult = PERSONALITIES[piece.personality]
      const grievance = piece.grievance + scaled(CHAOS_CONFIG.grievancePerAdjacentUnpaidLoss, mult.grievanceRise)
      const anger = piece.anger + scaled(CHAOS_CONFIG.angerPerAdjacentUnpaidLoss, mult.angerRise)
      piecesById[id] = { ...piece, grievance, anger }
      news.push({
        type: 'grievance-nearby',
        side: moverLabel,
        square: piece.square,
        pieceType: piece.type,
        personality: piece.personality,
      })
    }
  }

  return { ...chaos, piecesById, pendingUnpaidLoss: { ...chaos.pendingUnpaidLoss, [moverLabel]: null } }
}

function applyCaptureCoolOff(chaos, moverColor, moverLabel, news) {
  const piecesById = { ...chaos.piecesById }
  for (const [id, piece] of Object.entries(piecesById)) {
    if (piece.color !== moverColor) continue
    const mult = PERSONALITIES[piece.personality]
    piecesById[id] = {
      ...piece,
      grievance: Math.max(0, piece.grievance - scaled(CHAOS_CONFIG.grievanceDecayPerCapture, mult.grievanceFall)),
      anger: Math.max(0, piece.anger - scaled(CHAOS_CONFIG.angerDecayPerCapture, mult.angerFall)),
    }
  }
  news.push({ type: 'capture-calms', side: moverLabel })
  return { ...chaos, piecesById }
}

function applyFatigue(chaos, moverColor, moverId) {
  const piecesById = { ...chaos.piecesById }
  for (const [id, piece] of Object.entries(piecesById)) {
    if (piece.color !== moverColor) continue
    const mult = PERSONALITIES[piece.personality]
    if (id === moverId) {
      piecesById[id] = { ...piece, fatigue: piece.fatigue + scaled(CHAOS_CONFIG.fatiguePerMove, mult.fatigueRise) }
    } else {
      piecesById[id] = {
        ...piece,
        fatigue: Math.max(0, piece.fatigue - scaled(CHAOS_CONFIG.fatigueDecayPerTurn, mult.fatigueFall)),
      }
    }
  }
  return { ...chaos, piecesById }
}

// One of the mover's own turns has passed: tick down sleep/strike counters,
// then check whether fatigue/grievance/anger just crossed a threshold.
function tickAndRecomputeStatus(chaos, moverColor, moverLabel, news) {
  const piecesById = { ...chaos.piecesById }
  for (const [id, piece] of Object.entries(piecesById)) {
    if (piece.color !== moverColor) continue
    const next = { ...piece }
    const wasRebel = next.status === 'rebel'

    if (next.sleepTurnsLeft > 0) {
      next.sleepTurnsLeft -= 1
      if (next.sleepTurnsLeft === 0) {
        next.fatigue = 0
        news.push({ type: 'wakes-up', side: moverLabel, square: next.square, pieceType: next.type, personality: next.personality })
      }
    }
    if (next.strikeTurnsLeft > 0) {
      next.strikeTurnsLeft -= 1
      if (next.strikeTurnsLeft === 0) {
        next.grievance = 0
        news.push({ type: 'strike-ends', side: moverLabel, square: next.square, pieceType: next.type, personality: next.personality })
      }
    }

    const stillTimedOut = next.sleepTurnsLeft > 0 || next.strikeTurnsLeft > 0
    if (!stillTimedOut) {
      if (next.fatigue >= CHAOS_CONFIG.sleepThreshold) {
        next.sleepTurnsLeft = CHAOS_CONFIG.sleepDuration
        next.fatigue = 0
        news.push({ type: 'falls-asleep', side: moverLabel, square: next.square, pieceType: next.type, personality: next.personality })
      } else if (next.grievance >= CHAOS_CONFIG.strikeThreshold) {
        next.strikeTurnsLeft = CHAOS_CONFIG.strikeDuration
        next.grievance = 0
        news.push({ type: 'walks-out', side: moverLabel, square: next.square, pieceType: next.type, personality: next.personality })
      }
    }

    next.status = recomputeStatus(next)
    if (!wasRebel && next.status === 'rebel') {
      news.push({ type: 'furious', side: moverLabel, square: next.square, pieceType: next.type, personality: next.personality })
    } else if (wasRebel && next.status !== 'rebel') {
      news.push({ type: 'calms-down', side: moverLabel, square: next.square, pieceType: next.type, personality: next.personality })
    }

    piecesById[id] = next
  }
  return { ...chaos, piecesById }
}

// Applies a move to chess.js (mutating it, same contract as unionRules.js's
// applyMove) and returns { chess, chaos, news, refused }. A furious ("rebel")
// piece rolls against its own personality's rebelChance before the move is
// actually made: it may refuse outright (refused: true, nothing changes on
// the board) or swap in a different legal move of its own. Either outcome
// is reported in news so it reads the same wherever it's displayed.
export function applyChaosMove(state, moveArg) {
  const { chess } = state
  let chaos = state.chaos
  const news = []

  const candidates = chess.moves({ verbose: true })
  const requested = candidates.find((move) => matchesCandidate(move, moveArg))
  if (!requested) return { ...state, refused: false }

  const moverColor = chess.turn()
  const mover = moverColor === 'w' ? 'white' : 'black'
  const moverId = chaos.bySquare[requested.from]
  const moverPiece = moverId ? chaos.piecesById[moverId] : null

  let finalMove = requested

  if (moverPiece && moverPiece.status === 'rebel') {
    const chance = PERSONALITIES[moverPiece.personality].rebelChance
    const roll = nextRandom(chaos.rngState)
    chaos = { ...chaos, rngState: roll.state }

    if (roll.value < chance) {
      const alternatives = candidates.filter(
        (move) => move.from === requested.from && !(move.to === requested.to && move.promotion === requested.promotion),
      )
      const coin = nextRandom(chaos.rngState)
      chaos = { ...chaos, rngState: coin.state }

      if (coin.value < 0.5 || alternatives.length === 0) {
        news.push({
          type: 'refusal',
          side: mover,
          square: requested.from,
          pieceType: moverPiece.type,
          personality: moverPiece.personality,
        })
        return { chess, chaos, news: [...news.reverse(), ...state.news], refused: true }
      }

      const pick = randomInt(chaos.rngState, alternatives.length)
      chaos = { ...chaos, rngState: pick.state }
      finalMove = alternatives[pick.value]
      news.push({
        type: 'rebel-move',
        side: mover,
        from: requested.from,
        to: finalMove.to,
        pieceType: moverPiece.type,
        personality: moverPiece.personality,
      })
    }
  }

  const result = chess.move(finalMove)
  const isCapture = Boolean(result.captured)

  chaos = trackMove(chaos, result)
  chaos = resolvePendingLoss(chaos, mover, moverColor, isCapture, news)
  if (isCapture) chaos = applyCaptureCoolOff(chaos, moverColor, mover, news)
  chaos = applyFatigue(chaos, moverColor, moverId)
  chaos = tickAndRecomputeStatus(chaos, moverColor, mover, news)

  if (isCapture) {
    const capturedLabel = mover === 'white' ? 'black' : 'white'
    const capturedSquare = result.flags.includes('e') ? squareForEnPassantVictim(result) : result.to
    chaos = { ...chaos, pendingUnpaidLoss: { ...chaos.pendingUnpaidLoss, [capturedLabel]: capturedSquare } }
  }

  return { chess, chaos, news: [...news.reverse(), ...state.news], refused: false, appliedMove: { from: finalMove.from, to: finalMove.to } }
}

// Why a square with a piece on it has no move options right now (sleeping
// or striking) -- null if the piece isn't blocked. Rebel pieces are NOT
// blocked here: they still offer their full move list, and only roll
// against refusing/substituting once a move is actually attempted.
export function describeChaosBlockedSquare(chess, chaos, currentMoves, square) {
  const piece = chess.get(square)
  if (!piece) return null

  const rawMoves = chess.moves({ square, verbose: true })
  if (rawMoves.length === 0) return null

  const stillAllowed = currentMoves.some((move) => move.from === square)
  if (stillAllowed) return null

  const pieceState = chaos.piecesById[chaos.bySquare[square]]
  if (pieceState?.status === 'sleeping') {
    return `This piece is asleep (${pieceState.sleepTurnsLeft} turn${pieceState.sleepTurnsLeft === 1 ? '' : 's'} left).`
  }
  if (pieceState?.status === 'striking') {
    return `This piece is on strike (${pieceState.strikeTurnsLeft} turn${pieceState.strikeTurnsLeft === 1 ? '' : 's'} left).`
  }
  return 'That piece is sitting out right now.'
}
