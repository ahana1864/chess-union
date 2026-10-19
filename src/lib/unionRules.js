import { RULES_CONFIG } from './rulesConfig'

// Which chess.js piece letter belongs to which union. Only piece types with
// a grievance-based strike go here; rooks (P1) break for a different reason
// (4 consecutive moves by the same rook) and aren't tracked by grievance.
const PIECE_TO_UNION = {
  p: 'pawns',
}

function createPawnUnion() {
  return {
    grievance: 0,
    status: 'calm', // 'calm' | 'grumbling' | 'strike' | 'cooldown'
    turnsLeft: 0, // meaning depends on status: turns left on strike, or in cooldown
    pendingUnpaidLoss: false, // internal: did this side just lose a pawn, awaiting payment?
  }
}

function createSideUnions() {
  return {
    pawns: createPawnUnion(),
  }
}

export function createUnionState() {
  return {
    white: createSideUnions(),
    black: createSideUnions(),
  }
}

function otherSide(side) {
  return side === 'white' ? 'black' : 'white'
}

function isMoveBlockedByUnion(move, sideUnions) {
  const union = PIECE_TO_UNION[move.piece]
  if (!union) return false
  return sideUnions[union].status === 'strike'
}

// Strike-break: the union that was blocking every move returns to work
// immediately, in cooldown, with its grievance cleared.
function breakStrike(sideUnions, side) {
  if (sideUnions.pawns.status === 'strike') {
    return {
      sideUnions: {
        ...sideUnions,
        pawns: {
          grievance: 0,
          status: 'cooldown',
          turnsLeft: RULES_CONFIG.pawns.cooldownDuration,
          pendingUnpaidLoss: false,
        },
      },
      news: [{ type: 'strike-break', side, union: 'pawns' }],
    }
  }
  // Nothing was actually on strike (shouldn't happen while only pawns can
  // block moves outright), so there is nothing to break.
  return { sideUnions, news: [] }
}

// Returns the legal moves for the side to move, filtered by union status.
// If the filter would leave the side with no moves at all, but chess.js
// still has legal moves, the blocking union breaks its strike and the full
// move list is returned instead (see PRD "strike-break").
export function legalMoves(chess, unions) {
  const side = chess.turn() === 'w' ? 'white' : 'black'
  const allMoves = chess.moves({ verbose: true })

  if (allMoves.length === 0) {
    // No legal moves at all: the game is over (checkmate/stalemate), not a
    // strike-break situation.
    return { moves: [], unions, news: [] }
  }

  const sideUnions = unions[side]
  const permitted = allMoves.filter((move) => !isMoveBlockedByUnion(move, sideUnions))

  if (permitted.length > 0) {
    return { moves: permitted, unions, news: [] }
  }

  const { sideUnions: nextSideUnions, news } = breakStrike(sideUnions, side)
  return {
    moves: allMoves,
    unions: { ...unions, [side]: nextSideUnions },
    news,
  }
}

// Resolve an unpaid-loss debt the mover may be carrying from the opponent's
// last move: paid off by an immediate recapture, otherwise it becomes a
// grievance (unless the union is already on strike or cooling down, where
// grievance is frozen).
function resolvePawnDebt(sideUnions, side, isCapture, news) {
  const pawns = sideUnions.pawns
  if (!pawns.pendingUnpaidLoss) return sideUnions

  if (isCapture || (pawns.status !== 'calm' && pawns.status !== 'grumbling')) {
    return { ...sideUnions, pawns: { ...pawns, pendingUnpaidLoss: false } }
  }

  const grievance = pawns.grievance + 1
  news.push({ type: 'grievance-filed', side, union: 'pawns', grievance })
  return { ...sideUnions, pawns: { ...pawns, grievance, pendingUnpaidLoss: false } }
}

// Every capture a side makes lowers all of its own grievance counters by 1.
function coolOffFromCapture(sideUnions, side, news) {
  const pawns = sideUnions.pawns
  if (pawns.grievance <= 0) return sideUnions
  const grievance = pawns.grievance - 1
  news.push({ type: 'capture-calms', side, union: 'pawns', grievance })
  return { ...sideUnions, pawns: { ...pawns, grievance } }
}

// One of the mover's own turns has now passed under the union's current
// status: tick a strike or cooldown counter down, ending it if it reaches 0.
function tickPawnTimer(sideUnions, side, news) {
  const pawns = sideUnions.pawns

  if (pawns.status === 'strike') {
    const turnsLeft = pawns.turnsLeft - 1
    if (turnsLeft <= 0) {
      news.push({ type: 'strike-ends', side, union: 'pawns' })
      return {
        ...sideUnions,
        pawns: {
          grievance: 0,
          status: 'cooldown',
          turnsLeft: RULES_CONFIG.pawns.cooldownDuration,
          pendingUnpaidLoss: false,
        },
      }
    }
    return { ...sideUnions, pawns: { ...pawns, turnsLeft } }
  }

  if (pawns.status === 'cooldown') {
    const turnsLeft = pawns.turnsLeft - 1
    if (turnsLeft <= 0) {
      news.push({ type: 'cooldown', side, union: 'pawns' })
      return { ...sideUnions, pawns: { ...pawns, status: 'calm', turnsLeft: 0 } }
    }
    return { ...sideUnions, pawns: { ...pawns, turnsLeft } }
  }

  return sideUnions
}

// If grievance just crossed the strike threshold, start the strike.
// Otherwise keep the calm/grumbling status in sync with the grievance count.
function maybeStartStrike(sideUnions, side, news) {
  const pawns = sideUnions.pawns
  if (pawns.status !== 'calm' && pawns.status !== 'grumbling') return sideUnions

  if (pawns.grievance >= RULES_CONFIG.pawns.unpaidLossLimit) {
    news.push({ type: 'strike', side, union: 'pawns' })
    return {
      ...sideUnions,
      pawns: { ...pawns, status: 'strike', turnsLeft: RULES_CONFIG.pawns.strikeDuration },
    }
  }

  const nextStatus = pawns.grievance > 0 ? 'grumbling' : 'calm'
  if (nextStatus === pawns.status) return sideUnions
  if (nextStatus === 'grumbling') news.push({ type: 'grumbling', side, union: 'pawns' })
  return { ...sideUnions, pawns: { ...pawns, status: nextStatus } }
}

// Applies a move to the chess.js game (mutating it, same as chess.js itself)
// and returns a new state with the union bookkeeping updated and any news
// events from this move prepended (state.news is newest-first).
export function applyMove(state, move) {
  const { chess, unions } = state
  const mover = chess.turn() === 'w' ? 'white' : 'black'
  const opponent = otherSide(mover)

  const result = chess.move(move)
  const isCapture = Boolean(result.captured)
  const news = []

  let moverUnions = unions[mover]
  let opponentUnions = unions[opponent]

  moverUnions = resolvePawnDebt(moverUnions, mover, isCapture, news)
  if (isCapture) {
    moverUnions = coolOffFromCapture(moverUnions, mover, news)
  }
  moverUnions = tickPawnTimer(moverUnions, mover, news)
  moverUnions = maybeStartStrike(moverUnions, mover, news)

  if (isCapture) {
    const union = PIECE_TO_UNION[result.captured]
    if (union) {
      opponentUnions = {
        ...opponentUnions,
        [union]: { ...opponentUnions[union], pendingUnpaidLoss: true },
      }
    }
  }

  return {
    ...state,
    chess,
    unions: { ...unions, [mover]: moverUnions, [opponent]: opponentUnions },
    news: [...news, ...state.news],
  }
}
