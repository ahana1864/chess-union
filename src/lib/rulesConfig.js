// All union thresholds and durations in one place, so play-testing can tune
// the numbers without touching unionRules.js. "Turns" means turns of the
// side the union belongs to, not half-moves overall.
export const RULES_CONFIG = {
  pawns: {
    unpaidLossLimit: 3, // unpaid losses before the union strikes
    strikeDuration: 3, // turns pawns refuse to move or capture
    cooldownDuration: 5, // turns before the union can strike again
  },
}
