import { UnionCard } from './UnionCard'

export function UnionPanel({ unions, sideToMove }) {
  return (
    <div className="union-panel">
      <h2 className="union-panel-heading">THE UNIONS</h2>
      <UnionCard
        side="black"
        sideLabel="Black"
        isToMove={sideToMove === 'black'}
        unions={unions.black}
      />
      <UnionCard
        side="white"
        sideLabel="White"
        isToMove={sideToMove === 'white'}
        unions={unions.white}
      />
      <p className="union-panel-explainer">
        Lose a piece without an immediate recapture and its union files a
        grievance. Three unpaid pawn losses and the pawns walk out — they
        still block and can still be captured, but they won't move until
        their strike runs its course (or a check forces them back to work).
      </p>
    </div>
  )
}
