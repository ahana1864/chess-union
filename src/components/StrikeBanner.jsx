const UNION_LABELS = {
  pawns: 'pawns',
  bishops: 'bishops',
  rooks: 'rooks',
}

function sideName(side) {
  return side === 'white' ? "White's" : "Black's"
}

// kind: 'strike' shows "<UNION> ON STRIKE"; 'strike-break' shows the King
// crossing the picket line. Both auto-dismiss (see Game.jsx), collapsing to
// the status chips and picket signs that stay for the rest of the strike.
export function StrikeBanner({ kind, side, union, turnsLeft }) {
  const unionLabel = UNION_LABELS[union] ?? union

  const title =
    kind === 'strike-break' ? 'THE KING CROSSES THE PICKET LINE' : `${unionLabel.toUpperCase()} ON STRIKE`

  const detail =
    kind === 'strike-break'
      ? `${sideName(side)} ${unionLabel} break the strike to get out of check, and head straight into cooldown.`
      : `${sideName(side)} ${unionLabel} won't move or capture for ${turnsLeft} turns. Capture something to cool things down.`

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
