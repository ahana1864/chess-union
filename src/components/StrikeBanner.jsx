import { RULES_CONFIG } from '../lib/rulesConfig'

const UNION_LABELS = {
  pawns: 'pawns',
  bishops: 'bishops',
  rooks: 'rooks',
}

function sideName(side) {
  return side === 'white' ? "White's" : "Black's"
}

function pluralTurns(n) {
  return `${n} turn${n === 1 ? '' : 's'}`
}

// Pawns and rooks fully stop; bishops only work to rule (still move, just
// not far); rooks also skip the cooldown step entirely. Each gets its own
// phrasing so the banner stays accurate, not just generically "on strike".
function strikeDetail(side, union, turnsLeft) {
  if (union === 'bishops') {
    return `${sideName(side)} bishops can only move up to ${RULES_CONFIG.bishops.maxSquares} squares for ${pluralTurns(turnsLeft)}. Capture something to cool things down.`
  }
  if (union === 'rooks') {
    return `${sideName(side)} rooks sit out for ${pluralTurns(turnsLeft)}.`
  }
  return `${sideName(side)} pawns won't move or capture for ${pluralTurns(turnsLeft)}. Capture something to cool things down.`
}

function strikeBreakDetail(side, union) {
  if (union === 'rooks') {
    return `${sideName(side)} rooks break early to get out of check, and go straight back to work.`
  }
  return `${sideName(side)} ${UNION_LABELS[union]} break the strike to get out of check, and head straight into cooldown.`
}

// kind: 'strike' shows "<UNION> ON STRIKE"; 'strike-break' shows the King
// crossing the picket line. Both auto-dismiss (see Game.jsx), collapsing to
// the status chips (and, for pawns, picket signs) that stay for the rest of
// the strike.
export function StrikeBanner({ kind, side, union, turnsLeft }) {
  const unionLabel = UNION_LABELS[union] ?? union

  const title =
    kind === 'strike-break'
      ? 'THE KING CROSSES THE PICKET LINE'
      : `${unionLabel.toUpperCase()} ON STRIKE`

  const detail =
    kind === 'strike-break' ? strikeBreakDetail(side, union) : strikeDetail(side, union, turnsLeft)

  return (
    <div className="strike-banner" role="status">
      <div className="strike-banner-sign" aria-hidden="true">
        <div className="strike-banner-stick" />
        <div className="strike-banner-placard">
          <span className="picket-stripe picket-stripe-strike" />
          <span className="picket-stripe picket-stripe-ink" />
        </div>
      </div>
      <div className="strike-banner-text">
        <p className="strike-banner-title">{title}</p>
        <p className="strike-banner-detail">{detail}</p>
      </div>
    </div>
  )
}
