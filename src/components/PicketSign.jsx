// Small cardboard placard shown on a striking pawn's square. Purely
// decorative, so it's hidden from assistive tech (the union panel's status
// chip is what actually conveys the strike).
export function PicketSign() {
  return (
    <div className="picket-sign" aria-hidden="true">
      <div className="picket-stick" />
      <div className="picket-placard">
        <span className="picket-stripe picket-stripe-strike" />
        <span className="picket-stripe picket-stripe-ink" />
      </div>
    </div>
  )
}
