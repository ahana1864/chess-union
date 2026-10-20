import { UnionCard } from './UnionCard'

const SIDE_LABELS = { white: 'White', black: 'Black' }

// Opponent on top, you on the bottom, matching the board orientation (so if
// you're playing Black, Black's card sits at the bottom where your pieces
// visually are).
export function UnionPanel({ unions, sideToMove, orientation = 'white', hasBishop }) {
  const bottomSide = orientation
  const topSide = orientation === 'white' ? 'black' : 'white'

  return (
    <div className="union-panel">
      <h2 className="union-panel-heading">THE UNIONS</h2>
      <UnionCard
        side={topSide}
        sideLabel={SIDE_LABELS[topSide]}
        isToMove={sideToMove === topSide}
        unions={unions[topSide]}
        hasBishop={hasBishop[topSide]}
      />
      <UnionCard
        side={bottomSide}
        sideLabel={SIDE_LABELS[bottomSide]}
        isToMove={sideToMove === bottomSide}
        unions={unions[bottomSide]}
        hasBishop={hasBishop[bottomSide]}
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
