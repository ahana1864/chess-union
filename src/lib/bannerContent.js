import { RULES_CONFIG } from './rulesConfig'
import { iconUrl } from './assetPath'

function sideName(side) {
  return side === 'white' ? "White's" : "Black's"
}

function pluralTurns(n) {
  return `${n} turn${n === 1 ? '' : 's'}`
}

// Builds the {title, subtitle, icon} a strike-banner shows for one union
// news event (icon is null for the pawn cases, which show the picket-sign
// placard instead of an image). unions is the state *after* this event, so
// turnsLeft reads correctly for the union that just changed.
export function bannerContentFor(event, unions) {
  const { side, union } = event

  if (union === 'minors') {
    const turnsLeft = unions[side]?.minors?.turnsLeft ?? 0
    return {
      title: 'BISHOPS ON WORK-TO-RULE',
      subtitle: `${sideName(side)} bishops move ${RULES_CONFIG.minors.maxSquares} squares at most for ${pluralTurns(turnsLeft)}. Capture something to cool things down.`,
      icon: iconUrl('anger.png'),
    }
  }

  if (union === 'rooks') {
    return {
      title: 'ROOKS TAKE A NAP',
      subtitle: `${sideName(side)} rooks sit out this turn.`,
      icon: iconUrl('zzz.png'),
    }
  }

  // Pawns: the only union with a strike-break banner too.
  if (event.type === 'strike-break') {
    return {
      title: 'THE KING CROSSES THE PICKET LINE',
      subtitle: `${sideName(side)} pawns break the strike to get out of check, and head straight into cooldown.`,
      icon: null,
    }
  }

  const turnsLeft = unions[side]?.pawns?.turnsLeft ?? 0
  return {
    title: 'PAWNS ON STRIKE',
    subtitle: `${sideName(side)} pawns won't move or capture for ${pluralTurns(turnsLeft)}. Capture something to cool things down.`,
    icon: null,
  }
}
