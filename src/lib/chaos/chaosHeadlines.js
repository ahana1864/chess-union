// Turns a chaos news event into a headline string, same deterministic-
// variant idea as src/lib/headlines.js for classic unions, kept as its own
// file/templates since the event shapes (per-piece, with a personality and
// a square) are different from the per-union ones there.

const PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

function cap(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function sideName(side) {
  return side === 'white' ? 'White' : 'Black'
}

function pieceName(pieceType) {
  return PIECE_NAMES[pieceType] ?? 'piece'
}

function pickVariant(variants, seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return variants[hash % variants.length]
}

const TEMPLATES = {
  'falls-asleep': (side, piece, event) => [
    `${sideName(side)}'s ${event.personality} ${piece} on ${event.square} dozes off mid-game.`,
    `Lights out for the ${sideName(side)} ${piece} on ${event.square} -- too many shifts in a row.`,
    `The ${sideName(side)} ${piece} on ${event.square} is out cold. Wake-up call in a turn.`,
  ],
  'wakes-up': (side, piece, event) => [
    `${sideName(side)}'s ${piece} on ${event.square} blinks awake and gets back to it.`,
    `Rise and shine: ${sideName(side)}'s ${piece} on ${event.square} is back on the clock.`,
  ],
  'walks-out': (side, piece, event) => [
    `${sideName(side)}'s ${event.personality} ${piece} on ${event.square} walks out.`,
    `${sideName(side)}'s ${piece} on ${event.square} downs tools, furious at the losses.`,
    `Picket line forms around the ${sideName(side)} ${piece} on ${event.square}.`,
  ],
  'strike-ends': (side, piece, event) => [
    `${sideName(side)}'s ${piece} on ${event.square} is back in the fight.`,
    `The ${sideName(side)} ${piece} on ${event.square} calls off its one-piece strike.`,
  ],
  furious: (side, piece, event) => [
    `${sideName(side)}'s ${event.personality} ${piece} on ${event.square} is seeing red.`,
    `Watch out: ${sideName(side)}'s ${piece} on ${event.square} looks ready to do something rash.`,
  ],
  'calms-down': (side, piece, event) => [`${sideName(side)}'s ${piece} on ${event.square} takes a breath and calms down.`],
  refusal: (side, piece, event) => [
    `${sideName(side)}'s ${event.personality} ${piece} on ${event.square} flat-out refuses to move.`,
    `"Not today." ${sideName(side)}'s ${piece} on ${event.square} won't budge.`,
  ],
  'rebel-move': (side, piece, event) => [
    `${sideName(side)}'s ${event.personality} ${piece} ignores orders and lands on ${event.to} instead.`,
    `Insubordination: the ${sideName(side)} ${piece} picks its own move, landing on ${event.to}.`,
  ],
  'grievance-nearby': (side, piece, event) => [
    `${sideName(side)}'s ${event.personality} ${piece} on ${event.square} grows resentful after the loss nearby.`,
    `${sideName(side)}'s ${piece} on ${event.square} is taking that loss personally.`,
  ],
  'capture-calms': (side) => [
    `That capture settles some nerves in the ${sideName(side)} ranks.`,
    `${sideName(side)}'s pieces relax a little after the trade.`,
  ],
  'chaos-strike-break': (side, piece, event) => [
    `Emergency: ${sideName(side)}'s ${event.personality} ${piece} on ${event.square} snaps out of it rather than lose the game.`,
  ],
}

const TONES = {
  'falls-asleep': 'warning',
  'wakes-up': 'normal',
  'walks-out': 'alert',
  'strike-ends': 'normal',
  furious: 'warning',
  'calms-down': 'normal',
  refusal: 'alert',
  'rebel-move': 'alert',
  'grievance-nearby': 'warning',
  'capture-calms': 'normal',
  'chaos-strike-break': 'alert',
}

export function chaosHeadlineFor(event) {
  const build = TEMPLATES[event.type]
  if (!build) return { text: '', tone: 'normal' }

  const piece = pieceName(event.pieceType)
  const variants = build(event.side, piece, event)
  const text = pickVariant(variants, `${event.type}:${event.side}:${event.square ?? ''}:${event.to ?? ''}`)
  return { text: cap(text), tone: TONES[event.type] ?? 'normal' }
}
