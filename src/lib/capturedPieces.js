// Pawn, knight, bishop, rook, queen -- the usual tray ordering by value.
const PIECE_ORDER = ['p', 'n', 'b', 'r', 'q']

function byValue(list) {
  return [...list].sort((a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b))
}

// Derives each side's captured-piece tray from chess.js's own move history,
// rather than tracking it separately — history is already the source of
// truth and never drifts from the board.
export function getCapturedPieces(chess) {
  const byWhite = []
  const byBlack = []
  for (const move of chess.history({ verbose: true })) {
    if (!move.captured) continue
    if (move.color === 'w') byWhite.push(move.captured)
    else byBlack.push(move.captured)
  }
  return { byWhite: byValue(byWhite), byBlack: byValue(byBlack) }
}
