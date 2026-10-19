// All union thresholds and durations in one place, so play-testing can tune
// the numbers without touching unionRules.js. "Turns" means turns of the
// side the union belongs to, not half-moves overall.
export const RULES_CONFIG = {
  pawns: {
    unpaidLossLimit: 3, // unpaid losses before the union strikes
    strikeDuration: 3, // turns pawns refuse to move or capture
    cooldownDuration: 5, // turns before the union can strike again
  },
  bishops: {
    unpaidLossLimit: 2, // unpaid losses before the union works to rule
    strikeDuration: 3, // turns bishops are limited to maxSquares
    cooldownDuration: 5, // turns before the union can work to rule again
    maxSquares: 2, // furthest a bishop may move while working to rule
  },
  rooks: {
    consecutiveMovesLimit: 4, // same rook moving this many turns in a row
    sitOutDuration: 1, // turns the rook union sits out, no cooldown after
  },
}
