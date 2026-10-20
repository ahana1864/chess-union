function pluralTurns(n) {
  return `${n} turn${n === 1 ? '' : 's'}`
}

// The toast text for a piece whose own union is why a move can't happen --
// null if that union isn't actually the reason. Shared between the live
// game (useGame.js) and the demo (demoRunner.js), so both ever describe a
// blocked move the same way, through the same code.
export function blockedByUnionText(piece, side, unions) {
  const sideUnions = unions[side]
  if (piece.type === 'p' && sideUnions.pawns.status === 'strike') {
    return `Pawns are on strike (${pluralTurns(sideUnions.pawns.turnsLeft)} left)`
  }
  if (piece.type === 'b' && sideUnions.minors.status === 'strike') {
    return `Bishops are on work-to-rule (${pluralTurns(sideUnions.minors.turnsLeft)} left)`
  }
  if (piece.type === 'r' && sideUnions.rooks.status === 'strike') {
    return `Rooks are asleep (${pluralTurns(sideUnions.rooks.turnsLeft)} left)`
  }
  return null
}

// Why a square with a piece on it has no move options at all (used when a
// piece is first selected) -- null if the piece isn't blocked by a union.
export function describeBlockedSquare(chess, unions, currentMoves, square) {
  const piece = chess.get(square)
  if (!piece) return null

  const rawMoves = chess.moves({ square, verbose: true })
  if (rawMoves.length === 0) return null

  const stillAllowed = currentMoves.some((move) => move.from === square)
  if (stillAllowed) return null

  const side = chess.turn() === 'w' ? 'white' : 'black'
  return blockedByUnionText(piece, side, unions) ?? 'That piece is sitting out right now.'
}

// Why one specific move isn't allowed (used when a piece has some legal
// moves but the player tries a particular blocked target, e.g. a
// restricted bishop reaching past its work-to-rule limit) -- null if that
// exact move is legal, or isn't a real chess move at all.
export function describeBlockedMove(chess, unions, currentMoves, fromSquare, toSquare) {
  const piece = chess.get(fromSquare)
  if (!piece) return null

  const isRealChessMove = chess
    .moves({ square: fromSquare, verbose: true })
    .some((move) => move.to === toSquare)
  if (!isRealChessMove) return null

  const stillAllowed = currentMoves.some(
    (move) => move.from === fromSquare && move.to === toSquare,
  )
  if (stillAllowed) return null

  const side = chess.turn() === 'w' ? 'white' : 'black'
  return blockedByUnionText(piece, side, unions)
}
