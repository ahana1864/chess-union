function sideName(side) {
  return side === 'white' ? "White's" : "Black's"
}

function pluralTurns(n) {
  return `${n} turn${n === 1 ? '' : 's'}`
}

// Pawns only: minors (work-to-rule) and rooks (sit-out) are shown entirely
// through the union card and the news feed instead -- see UI-SPEC.
export function StrikeBanner({ kind, side, turnsLeft }) {
  const title = kind === 'strike-break' ? 'THE KING CROSSES THE PICKET LINE' : 'PAWNS ON STRIKE'

  const detail =
    kind === 'strike-break'
      ? `${sideName(side)} pawns break the strike to get out of check, and head straight into cooldown.`
      : `${sideName(side)} pawns won't move or capture for ${pluralTurns(turnsLeft)}. Capture something to cool things down.`

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
