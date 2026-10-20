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
