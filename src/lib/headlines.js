// Turns a news event (type + parameters, see unionRules.js) into a funny
// headline string. Variant choice is deterministic (hashed from the event
// itself), not random, so the same event always produces the same text —
// that keeps snapshot-style tests and the news feed stable across renders.

const UNION_LABELS = {
  pawns: 'pawns',
  bishops: 'bishops',
  rooks: 'rooks',
}

function cap(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function sideName(side) {
  return side === 'white' ? 'White' : 'Black'
}

// Small stable hash so the same event always picks the same variant.
function pickVariant(variants, seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return variants[hash % variants.length]
}

const TEMPLATES = {
  'grievance-filed': (side, union, event) => [
    `${sideName(side)}'s ${union} file grievance #${event.grievance} after another unpaid loss.`,
    `${sideName(side)}'s ${union} union rep notes the loss. Paperwork has been filed.`,
    `No severance, no thanks: ${sideName(side)}'s ${union} grievance count ticks up to ${event.grievance}.`,
    `Another fallen comrade goes unpaid. ${sideName(side)}'s ${union} are keeping count.`,
  ],
  grumbling: (side, union) => [
    `${sideName(side)}'s ${union} start grumbling on the back rank.`,
    `Mutterings spread through ${sideName(side)}'s ${union} — morale is slipping.`,
    `${sideName(side)}'s ${union} are not happy. Not happy at all.`,
  ],
  strike: (side, union) => [
    `${sideName(side).toUpperCase()}'S ${union.toUpperCase()} WALK OUT. Picket signs at the ready.`,
    `${sideName(side)}'s ${union} down tools. No moves, no captures, no exceptions.`,
    `Breaking: ${sideName(side)}'s ${union} are officially on strike.`,
  ],
  'strike-ends': (side, union) => [
    `${sideName(side)}'s ${union} clock out — the strike is over, for now.`,
    `${sideName(side)}'s ${union} return to work, grievances forgiven for the moment.`,
    `The picket line folds: ${sideName(side)}'s ${union} are back on duty.`,
  ],
  cooldown: (side, union) => [
    `${sideName(side)}'s ${union} report back to normal duties.`,
    `Calm restored: the ${sideName(side)} ${union} cooldown period ends.`,
    `${sideName(side)}'s ${union} are, for now, perfectly content.`,
  ],
  'strike-break': (side, union) => [
    `Scandal! ${sideName(side)}'s ${union} cross their own picket line.`,
    `The King crosses the picket line — ${sideName(side)}'s ${union} are back to work immediately.`,
    `Emergency session: ${sideName(side)}'s ${union} break the strike rather than lose the game.`,
  ],
  'capture-calms': (side, union) => [
    `A capture settles some nerves among ${sideName(side)}'s ${union}.`,
    `${sideName(side)}'s ${union} grievance eases after that capture.`,
    `Tensions cool slightly among the ${sideName(side)} ${union} after a clean trade.`,
  ],
}

// Normal: routine news. Warning: escalating. Alert: the big, dramatic beats.
const TONES = {
  'grievance-filed': 'warning',
  grumbling: 'warning',
  strike: 'alert',
  'strike-ends': 'normal',
  cooldown: 'normal',
  'strike-break': 'alert',
  'capture-calms': 'normal',
}

export function headlineFor(event) {
  const union = UNION_LABELS[event.union] ?? event.union
  const build = TEMPLATES[event.type]
  if (!build) return { text: '', tone: 'normal' }

  const variants = build(event.side, union, event)
  const text = pickVariant(variants, `${event.type}:${event.side}:${event.union}:${event.grievance ?? ''}`)
  return { text: cap(text), tone: TONES[event.type] ?? 'normal' }
}
