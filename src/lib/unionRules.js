import { RULES_CONFIG } from './rulesConfig'

const FILES = 'abcdefgh'

// Which chess.js piece letter belongs to which grievance-based union
// (unpaid loss -> strike -> cooldown, same mechanic for both). Rooks break
// for a different reason entirely (4 consecutive moves by the same rook)
// and aren't tracked by grievance, so they're deliberately left out.
const PIECE_TO_UNION = {
  p: 'pawns',
  b: 'bishops',
}

const GRIEVANCE_UNIONS = ['pawns', 'bishops']

function createGrievanceUnion() {
  return {
    grievance: 0,
    status: 'calm', // 'calm' | 'grumbling' | 'strike' | 'cooldown'
    turnsLeft: 0, // meaning depends on status: turns left on strike, or in cooldown
    pendingUnpaidLoss: false, // internal: did this side just lose a piece, awaiting payment?
  }
}

function createRookUnion() {
  return {
    consecutiveMoves: 0,
    trackedSquare: null, // internal: square the streaking rook is currently on
    status: 'calm', // 'calm' | 'grumbling' | 'strike' (no cooldown for rooks)
    turnsLeft: 0,
  }
}

function createSideUnions() {
  return {
    pawns: createGrievanceUnion(),
    bishops: createGrievanceUnion(),
    rooks: createRookUnion(),
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

// How many squares a move crosses, for the bishop work-to-rule range check.
// Diagonal moves always have an equal file/rank delta, so either works.
function squareDistance(from, to) {
  const fileDelta = Math.abs(FILES.indexOf(from[0]) - FILES.indexOf(to[0]))
  const rankDelta = Math.abs(Number(from[1]) - Number(to[1]))
  return Math.max(fileDelta, rankDelta)
}

function isMoveBlockedByUnion(move, sideUnions) {
  if (move.piece === 'p') {
    return sideUnions.pawns.status === 'strike'
  }
  if (move.piece === 'b') {
    return (
      sideUnions.bishops.status === 'strike' &&
      squareDistance(move.from, move.to) > RULES_CONFIG.bishops.maxSquares
    )
  }
  if (move.piece === 'r') {
    return sideUnions.rooks.status === 'strike'
  }
  return false
}

// Strike-break: every union currently blocking a move returns to work
// immediately (grievance-based unions go into cooldown with grievance
// cleared; rooks, which have no cooldown, go straight back to calm).
function breakStrike(sideUnions, side) {
  let next = sideUnions
  const news = []

  for (const unionKey of GRIEVANCE_UNIONS) {
    if (next[unionKey].status === 'strike') {
      next = {
        ...next,
        [unionKey]: {
          grievance: 0,
          status: 'cooldown',
          turnsLeft: RULES_CONFIG[unionKey].cooldownDuration,
          pendingUnpaidLoss: false,
        },
      }
      news.push({ type: 'strike-break', side, union: unionKey })
    }
  }

  if (next.rooks.status === 'strike') {
    next = { ...next, rooks: createRookUnion() }
    news.push({ type: 'strike-break', side, union: 'rooks' })
  }

  return { sideUnions: next, news }
}

// Returns the legal moves for the side to move, filtered by union status.
// If the filter would leave the side with no moves at all, but chess.js
// still has legal moves, the blocking union(s) break their strike and the
// full move list is returned instead (see PRD "strike-break").
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
function resolveDebt(sideUnions, unionKey, side, isCapture, news) {
  const union = sideUnions[unionKey]
  if (!union.pendingUnpaidLoss) return sideUnions

  if (isCapture || (union.status !== 'calm' && union.status !== 'grumbling')) {
    return { ...sideUnions, [unionKey]: { ...union, pendingUnpaidLoss: false } }
  }

  const grievance = union.grievance + 1
  news.push({ type: 'grievance-filed', side, union: unionKey, grievance })
  return { ...sideUnions, [unionKey]: { ...union, grievance, pendingUnpaidLoss: false } }
}

// Every capture a side makes lowers all of its own grievance counters by 1.
function coolOffFromCapture(sideUnions, unionKey, side, news) {
  const union = sideUnions[unionKey]
  if (union.grievance <= 0) return sideUnions
  const grievance = union.grievance - 1
  news.push({ type: 'capture-calms', side, union: unionKey, grievance })
  return { ...sideUnions, [unionKey]: { ...union, grievance } }
}

// One of the mover's own turns has now passed under the union's current
// status: tick a strike or cooldown counter down, ending it if it reaches 0.
function tickTimer(sideUnions, unionKey, side, news) {
  const union = sideUnions[unionKey]
  const config = RULES_CONFIG[unionKey]

  if (union.status === 'strike') {
    const turnsLeft = union.turnsLeft - 1
    if (turnsLeft <= 0) {
      news.push({ type: 'strike-ends', side, union: unionKey })
      return {
        ...sideUnions,
        [unionKey]: {
          grievance: 0,
          status: 'cooldown',
          turnsLeft: config.cooldownDuration,
          pendingUnpaidLoss: false,
        },
      }
    }
    return { ...sideUnions, [unionKey]: { ...union, turnsLeft } }
  }

  if (union.status === 'cooldown') {
    const turnsLeft = union.turnsLeft - 1
    if (turnsLeft <= 0) {
      news.push({ type: 'cooldown', side, union: unionKey })
      return { ...sideUnions, [unionKey]: { ...union, status: 'calm', turnsLeft: 0 } }
    }
    return { ...sideUnions, [unionKey]: { ...union, turnsLeft } }
  }

  return sideUnions
}

// If grievance just crossed the strike threshold, start the strike.
// Otherwise keep the calm/grumbling status in sync with the grievance count.
function maybeStartStrike(sideUnions, unionKey, side, news) {
  const union = sideUnions[unionKey]
  if (union.status !== 'calm' && union.status !== 'grumbling') return sideUnions

  if (union.grievance >= RULES_CONFIG[unionKey].unpaidLossLimit) {
    news.push({ type: 'strike', side, union: unionKey })
    return {
      ...sideUnions,
      [unionKey]: { ...union, status: 'strike', turnsLeft: RULES_CONFIG[unionKey].strikeDuration },
    }
  }

  const nextStatus = union.grievance > 0 ? 'grumbling' : 'calm'
  if (nextStatus === union.status) return sideUnions
  if (nextStatus === 'grumbling') news.push({ type: 'grumbling', side, union: unionKey })
  return { ...sideUnions, [unionKey]: { ...union, status: nextStatus } }
}

// Rooks: sitting out ticks down the same way a grievance union's strike
// does, but there's no cooldown afterwards — straight back to calm with the
// streak cleared.
function tickRookTimer(sideUnions, side, news) {
  const rooks = sideUnions.rooks
  if (rooks.status !== 'strike') return sideUnions

  const turnsLeft = rooks.turnsLeft - 1
  if (turnsLeft <= 0) {
    news.push({ type: 'strike-ends', side, union: 'rooks' })
    return { ...sideUnions, rooks: createRookUnion() }
  }
  return { ...sideUnions, rooks: { ...rooks, turnsLeft } }
}

// Tracks whether the piece that just moved was the same rook moving again
// (the streak continues), a different rook (a new streak starts), or
// anything else (the streak resets to 0). Frozen while the union is
// already sitting out or its sit-out was just ticked to an end above.
function updateRookStreak(sideUnions, side, result, news) {
  const rooks = sideUnions.rooks
  if (rooks.status !== 'calm' && rooks.status !== 'grumbling') return sideUnions

  const isRookMove = result.piece === 'r'
  if (!isRookMove) {
    if (rooks.consecutiveMoves === 0) return sideUnions
    return { ...sideUnions, rooks: { ...rooks, consecutiveMoves: 0, trackedSquare: null, status: 'calm' } }
  }

  const continuesStreak = result.from === rooks.trackedSquare
  const consecutiveMoves = continuesStreak ? rooks.consecutiveMoves + 1 : 1

  if (consecutiveMoves >= RULES_CONFIG.rooks.consecutiveMovesLimit) {
    news.push({ type: 'strike', side, union: 'rooks' })
    return {
      ...sideUnions,
      rooks: {
        consecutiveMoves,
        trackedSquare: result.to,
        status: 'strike',
        turnsLeft: RULES_CONFIG.rooks.sitOutDuration,
      },
    }
  }

  const nextStatus = 'grumbling'
  if (nextStatus !== rooks.status) news.push({ type: 'grumbling', side, union: 'rooks' })
  return { ...sideUnions, rooks: { consecutiveMoves, trackedSquare: result.to, status: nextStatus, turnsLeft: 0 } }
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

  for (const unionKey of GRIEVANCE_UNIONS) {
    moverUnions = resolveDebt(moverUnions, unionKey, mover, isCapture, news)
    if (isCapture) {
      moverUnions = coolOffFromCapture(moverUnions, unionKey, mover, news)
    }
    moverUnions = tickTimer(moverUnions, unionKey, mover, news)
    moverUnions = maybeStartStrike(moverUnions, unionKey, mover, news)
  }

  moverUnions = tickRookTimer(moverUnions, mover, news)
  moverUnions = updateRookStreak(moverUnions, mover, result, news)

  if (isCapture) {
    const unionKey = PIECE_TO_UNION[result.captured]
    if (unionKey) {
      opponentUnions = {
        ...opponentUnions,
        [unionKey]: { ...opponentUnions[unionKey], pendingUnpaidLoss: true },
      }
    }
  }

  return {
    ...state,
    chess,
    unions: { ...unions, [mover]: moverUnions, [opponent]: opponentUnions },
    // Later-computed events (e.g. a strike starting) are more newsworthy
    // than earlier ones from the same move (e.g. the grievance that caused
    // it), so put them first within this move's batch.
    news: [...news.slice().reverse(), ...state.news],
  }
}
