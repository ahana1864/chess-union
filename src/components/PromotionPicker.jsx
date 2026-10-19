import { pieceRenderers } from './pieceRenderers'

const PROMOTION_PIECES = ['q', 'r', 'b', 'n']

// Overlay row of 4 piece choices; the player must pick one (UI-SPEC: "the
// player must choose" — there is no default).
export function PromotionPicker({ color, onSelect, onCancel }) {
  return (
    <div className="promotion-backdrop" onClick={onCancel}>
      <div className="promotion-picker" onClick={(e) => e.stopPropagation()}>
        {PROMOTION_PIECES.map((piece) => {
          const Renderer = pieceRenderers[`${color}${piece.toUpperCase()}`]
          return (
            <button
              key={piece}
              type="button"
              className="promotion-choice"
              aria-label={`Promote to ${piece}`}
              onClick={() => onSelect(piece)}
            >
              <Renderer />
            </button>
          )
        })}
      </div>
    </div>
  )
}
