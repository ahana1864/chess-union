// Turns a news event (type + parameters, see unionRules.js) into a funny
// headline string. Variant choice is deterministic (hashed from the event
// itself), not random, so the same event always produces the same text —
// that keeps snapshot-style tests and the news feed stable across renders.

const UNION_LABELS = {
  pawns: 'pawns',
  minors: 'minors',
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

// Pawns and rooks fully stop; bishops only work to rule (still move, just
// not far), so their strike/strike-ends/strike-break headlines get their
// own wording per union rather than reusing one generic "walk out" line.
const STRIKE_TEMPLATES = {
  pawns: (side) => [
    `${sideName(side).toUpperCase()}'S PAWNS WALK OUT. Picket signs at the ready.`,
    `${sideName(side)}'s pawns down tools. No moves, no captures, no exceptions.`,
    `Breaking: ${sideName(side)}'s pawns are officially on strike.`,
  ],
  minors: (side) => [
    `${sideName(side)}'s minors announce a strict work-to-rule: bishops limited to two squares.`,
    `${sideName(side)}'s bishops stop cutting corners — literally. Short moves only.`,
    `Breaking: ${sideName(side)}'s bishops adopt a go-slow. Long diagonals are off the table.`,
  ],
  rooks: (side) => [
    `${sideName(side)}'s rooks down tools after one shift too many on the same file.`,
    `${sideName(side)}'s rooks are pulled from the roster for a turn. Overtime complaints.`,
    `Breaking: ${sideName(side)}'s rooks sit this one out.`,
  ],
}

const STRIKE_ENDS_TEMPLATES = {
  pawns: (side) => [
    `${sideName(side)}'s pawns clock out — the strike is over, for now.`,
    `${sideName(side)}'s pawns return to work, grievances forgiven for the moment.`,
    `The picket line folds: ${sideName(side)}'s pawns are back on duty.`,
  ],
  minors: (side) => [
    `${sideName(side)}'s bishops are cleared to cross the board again.`,
    `Work-to-rule lifted: ${sideName(side)}'s bishops can run the full diagonal once more.`,
    `${sideName(side)}'s bishops stretch their legs — long moves are back.`,
  ],
  rooks: (side) => [
    `${sideName(side)}'s rooks are back in the line-up.`,
    `${sideName(side)}'s rooks return from the bench.`,
    `Rotation over: ${sideName(side)}'s rooks are cleared to move again.`,
  ],
}

const STRIKE_BREAK_TEMPLATES = {
  pawns: (side) => [
    `Scandal! ${sideName(side)}'s pawns cross their own picket line.`,
    `The King crosses the picket line — ${sideName(side)}'s pawns are back to work immediately.`,
    `Emergency session: ${sideName(side)}'s pawns break the strike rather than lose the game.`,
  ],
  minors: (side) => [
    `Scandal! ${sideName(side)}'s bishops abandon the work-to-rule under pressure.`,
    `The King crosses the picket line — ${sideName(side)}'s bishops drop the restriction at once.`,
    `Emergency session: ${sideName(side)}'s bishops go long rather than lose the game.`,
  ],
  rooks: (side) => [
    `Scandal! ${sideName(side)}'s rooks cut their rotation short.`,
    `The King crosses the picket line — ${sideName(side)}'s rooks are called back in.`,
    `Emergency session: ${sideName(side)}'s rooks return early rather than lose the game.`,
  ],
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
  strike: (side, union, event) => (STRIKE_TEMPLATES[event.union] ?? STRIKE_TEMPLATES.pawns)(side),
  'strike-ends': (side, union, event) =>
    (STRIKE_ENDS_TEMPLATES[event.union] ?? STRIKE_ENDS_TEMPLATES.pawns)(side),
  cooldown: (side, union) => [
    `${sideName(side)}'s ${union} report back to normal duties.`,
    `Calm restored: the ${sideName(side)} ${union} cooldown period ends.`,
    `${sideName(side)}'s ${union} are, for now, perfectly content.`,
  ],
  'strike-break': (side, union, event) =>
    (STRIKE_BREAK_TEMPLATES[event.union] ?? STRIKE_BREAK_TEMPLATES.pawns)(side),
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
