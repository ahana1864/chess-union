// A union-flavoured sign-off for the game-over card. Picked deterministically
// from the final position so the same finished game always reads the same
// way (same trick as src/lib/headlines.js).
function pickVariant(variants, seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return variants[hash % variants.length]
}

const CHECKMATE_LINES = [
  (winner, _loser) => `The ${winner} union declares victory — paperwork expedited.`,
  (winner, loser) => `Checkmate. ${loser}'s unions file one final grievance.`,
  (winner) => `${winner} wins. Somewhere, a pawn is still on strike and hasn't heard the news.`,
]

const STALEMATE_LINES = [
  () => 'Stalemate. No one works, no one wins, everyone stays unionized.',
  () => "Nobody can move. Even the arbiter needs a union rep.",
]

const DRAW_LINES = [
  () => "A draw. Both sides' unions call it an even shift.",
  () => 'Draw. Management and labour agree to disagree.',
]

export function gameOverSignOff(chess) {
  const fen = chess.fen()
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'Black' : 'White'
    const loser = winner === 'White' ? 'Black' : 'White'
    return pickVariant(CHECKMATE_LINES, fen)(winner, loser)
  }
  if (chess.isStalemate()) return pickVariant(STALEMATE_LINES, fen)()
  return pickVariant(DRAW_LINES, fen)()
}
