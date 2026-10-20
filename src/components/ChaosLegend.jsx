// A single static legend for Chaos Mode's mood dots -- not a panel per
// piece (that's explicitly out of scope), just one explainer card where
// the union panel sits in classic mode.
export function ChaosLegend() {
  return (
    <div className="chaos-legend">
      <h2>CHAOS MODE</h2>
      <p>
        Every piece got a random personality when the game started: lazy, hot-headed, loyal, jumpy
        or dramatic. Each one rises and falls through fatigue, grievance and anger at its own pace.
      </p>
      <ul className="chaos-legend-list">
        <li>
          <span className="mood-dot mood-dot-calm" aria-hidden="true" /> Calm
        </li>
        <li>
          <span className="mood-dot mood-dot-uneasy" aria-hidden="true" /> Uneasy
        </li>
        <li>
          <span className="mood-dot mood-dot-angry" aria-hidden="true" /> Furious -- may refuse a
          move, or make one of its own
        </li>
      </ul>
      <p>
        The <strong>zzz</strong> icon means a tired piece is asleep for a turn; a picket sign means
        it's on strike. Either way, it'll always leave you at least one legal move.
      </p>
    </div>
  )
}
