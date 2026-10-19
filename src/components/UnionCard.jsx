import { RULES_CONFIG } from '../lib/rulesConfig'

const UNION_LABELS = {
  pawns: 'Pawns',
  bishops: 'Bishops',
  rooks: 'Rooks',
}

const STATUS_LABELS = {
  calm: 'Calm',
  grumbling: 'Grumbling',
  strike: 'On strike',
  cooldown: 'Cooldown',
}

function noteFor(data, limit) {
  if (data.status === 'strike') return `Back at work in ${data.turnsLeft} turns`
  if (data.status === 'cooldown') return `Cooling off for ${data.turnsLeft} turns`
  return `${data.grievance} of ${limit} unpaid losses`
}

function UnionRow({ unionKey, data }) {
  const limit = RULES_CONFIG[unionKey].unpaidLossLimit
  const segments = limit
  const fillColor =
    data.status === 'strike' ? 'var(--strike)' : data.status === 'grumbling' ? 'var(--warn)' : null

  return (
    <div className="union-row">
      <div className="union-row-header">
        <span className="union-row-name">{UNION_LABELS[unionKey]}</span>
        <span className={`status-chip status-chip-${data.status}`}>
          {STATUS_LABELS[data.status]}
        </span>
      </div>
      <div className="union-meter">
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            className="union-meter-segment"
            style={{
              backgroundColor: i < data.grievance && fillColor ? fillColor : 'var(--meter-empty)',
            }}
          />
        ))}
      </div>
      <p className="union-row-note">{noteFor(data, limit)}</p>
    </div>
  )
}

export function UnionCard({ side, sideLabel, isToMove, unions }) {
  return (
    <div className="union-card">
      <div className="union-card-header">
        <span className={`side-dot side-dot-${side}`} />
        <span className="union-card-name">{sideLabel}</span>
        {isToMove ? <span className="to-move-pill">TO MOVE</span> : null}
      </div>
      {Object.entries(unions).map(([unionKey, data]) => (
        <UnionRow key={unionKey} unionKey={unionKey} data={data} />
      ))}
    </div>
  )
}
