import { Chess } from 'chess.js'
import { applyMove, createUnionState, legalMoves } from './unionRules'
import { describeBlockedMove, describeBlockedSquare } from './blockedMoves'

// Deep-merges a case's unionOverrides (partial per-union fields, e.g.
// { white: { pawns: { grievance: 2, status: 'grumbling' } } }) onto a
// fresh createUnionState(). Only used where it saves scripting otherwise-
// reachable moves -- each case in demoScript.js says where and why.
function applyUnionOverrides(unions, overrides) {
  if (!overrides) return unions
  let next = unions
  for (const side of ['white', 'black']) {
    const sideOverrides = overrides[side]
    if (!sideOverrides) continue
    const mergedUnions = { ...next[side] }
    for (const [unionKey, fields] of Object.entries(sideOverrides)) {
      mergedUnions[unionKey] = { ...mergedUnions[unionKey], ...fields }
    }
    next = { ...next, [side]: mergedUnions }
  }
  return next
}

// Plays one demo case through the real engine -- the same legalMoves() and
// applyMove() the live game uses, never a special demo-only code path --
// and returns every frame worth showing: the starting position (after
// resolving any strike-break the starting union state already forces),
// then one frame per scripted move, then an optional final "blocked
// attempt" frame that proves a move is currently refused without actually
// playing it (built from the same blockedMoves.js helpers the live game's
// toast uses).
//
// Throws if a scripted SAN isn't a legal, union-permitted move at that
// point -- a script bug, not a user-facing situation, so callers should
// let it propagate (the Vitest test exists precisely to catch this).
export function playCase(demoCase) {
  const chess = new Chess(demoCase.fen)
  let unions = applyUnionOverrides(createUnionState(), demoCase.unionOverrides)
  const asOverridden = unions

  let result = legalMoves(chess, unions)
  unions = result.unions

  const frames = [{ fen: chess.fen(), unions, news: result.news, moveSan: null, kind: 'start' }]

  // Only add a lead-in frame showing the raw, not-yet-evaluated override
  // state when evaluating the starting position already forced a
  // strike-break (case 6) -- otherwise it would just duplicate frame 0.
  if (JSON.stringify(asOverridden) !== JSON.stringify(frames[0].unions)) {
    frames.unshift({ fen: chess.fen(), unions: asOverridden, news: [], moveSan: null, kind: 'setup' })
  }

  for (const moveSan of demoCase.moves) {
    const candidate = result.moves.find(
      (move) => move.san === moveSan || move.san.replace(/[+#]$/, '') === moveSan,
    )
    if (!candidate) {
      throw new Error(
        `Demo script error in case "${demoCase.id}": "${moveSan}" isn't a legal, ` +
          `union-permitted move at ${chess.fen()}`,
      )
    }

    const applied = applyMove({ chess, unions, news: [] }, candidate)
    unions = applied.unions
    result = legalMoves(chess, unions)
    unions = result.unions

    frames.push({
      fen: chess.fen(),
      unions,
      news: [...applied.news, ...result.news],
      moveSan,
      kind: 'move',
    })
  }

  if (demoCase.blockedAttempt) {
    const { square, from, to } = demoCase.blockedAttempt
    const message = from
      ? describeBlockedMove(chess, unions, result.moves, from, to)
      : describeBlockedSquare(chess, unions, result.moves, square)

    frames.push({
      fen: chess.fen(),
      unions,
      news: [],
      moveSan: null,
      kind: 'blocked-attempt',
      blockedSquare: from ?? square,
      message,
    })
  }

  return frames
}
