// Whether a side still has a bishop on the board. Used so the minors
// union's "work to rule" note can say "No bishops left" instead of a
// turns-left countdown once there's nothing left to restrict.
export function sideHasBishop(chess, side) {
  const color = side === 'white' ? 'w' : 'b'
  return chess
    .board()
    .flat()
    .some((square) => square && square.type === 'b' && square.color === color)
}

function squaresOfType(chess, side, type) {
  const color = side === 'white' ? 'w' : 'b'
  return chess
    .board()
    .flat()
    .filter((square) => square && square.type === type && square.color === color)
    .map((square) => square.square)
}

// Squares holding a piece that's currently restricted by its union's
// work-to-rule / sit-out status: every bishop of the side while its Minors
// union is on strike, every rook while its Rooks union is sitting out.
// Pawns aren't included here -- a pawn strike blocks every pawn
// unconditionally, so it's carried by status alone, not a square list.
// This is the single source of truth for which pieces get the on-board
// status icon, so it's directly testable independent of rendering.
export function restrictedSquares(chess, unions, side) {
  const squares = []
  if (unions[side].minors.status === 'strike') {
    squares.push(...squaresOfType(chess, side, 'b'))
  }
  if (unions[side].rooks.status === 'strike') {
    squares.push(...squaresOfType(chess, side, 'r'))
  }
  return squares
}
