import { Fragment } from 'react'

export function MoveList({ history }) {
  const rows = []
  for (let i = 0; i < history.length; i += 2) {
    rows.push([Math.floor(i / 2) + 1, history[i], history[i + 1]])
  }

  return (
    <div className="move-list">
      <h2 className="move-list-heading">MOVES</h2>
      <div className="move-grid">
        {rows.map(([number, white, black]) => (
          <Fragment key={number}>
            <span className="move-number">{number}</span>
            <span className="move-white">{white}</span>
            <span className="move-black">{black ?? ''}</span>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
