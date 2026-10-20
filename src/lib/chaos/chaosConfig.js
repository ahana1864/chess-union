// Chaos Mode thresholds and personality multipliers, all in one place (same
// idea as rulesConfig.js for classic unions) so the numbers can be tuned
// without touching chaosEngine.js. Every multiplier is "how fast relative
// to a neutral piece", applied to the base amounts below and rounded.
export const PERSONALITIES = {
  lazy: {
    fatigueRise: 1.4,
    fatigueFall: 0.6,
    grievanceRise: 0.7,
    grievanceFall: 1.3,
    angerRise: 0.7,
    angerFall: 1.3,
    rebelChance: 0.3,
  },
  'hot-headed': {
    fatigueRise: 0.9,
    fatigueFall: 1.1,
    grievanceRise: 1.3,
    grievanceFall: 0.7,
    angerRise: 1.5,
    angerFall: 0.6,
    rebelChance: 0.7,
  },
  loyal: {
    fatigueRise: 0.8,
    fatigueFall: 1.3,
    grievanceRise: 0.6,
    grievanceFall: 1.4,
    angerRise: 0.6,
    angerFall: 1.4,
    rebelChance: 0.2,
  },
  jumpy: {
    fatigueRise: 1.3,
    fatigueFall: 0.8,
    grievanceRise: 1.1,
    grievanceFall: 0.9,
    angerRise: 1.1,
    angerFall: 0.9,
    rebelChance: 0.55,
  },
  dramatic: {
    fatigueRise: 1.0,
    fatigueFall: 0.9,
    grievanceRise: 1.4,
    grievanceFall: 0.6,
    angerRise: 1.4,
    angerFall: 0.5,
    rebelChance: 0.65,
  },
}

export const PERSONALITY_KEYS = Object.keys(PERSONALITIES)

export const CHAOS_CONFIG = {
  // Fatigue: moving a piece raises its own fatigue; every other piece on
  // that side recovers a little each of that side's turns. At the
  // threshold the piece sleeps through its side's next turn.
  fatiguePerMove: 2,
  fatigueDecayPerTurn: 1,
  sleepThreshold: 3,
  sleepDuration: 1,

  // Grievance: an unpaid loss (the losing side's very next move isn't a
  // recapture) raises grievance and anger for every piece of that side
  // adjacent to the square the piece was lost on. Any capture by a side
  // lowers every one of its own pieces' grievance and anger a little. At
  // the grievance threshold the piece strikes.
  grievancePerAdjacentUnpaidLoss: 4,
  grievanceDecayPerCapture: 2,
  strikeThreshold: 4,
  strikeDuration: 2,

  // Anger: rises and falls with grievance (see above) but on its own
  // counter and its own multipliers. At the threshold the piece turns
  // "rebel" -- on its own turns it may refuse to move, or move itself
  // instead, per its personality's rebelChance.
  angerPerAdjacentUnpaidLoss: 4,
  angerDecayPerCapture: 2,
  furiousThreshold: 4,
}
