import { PieceGlyph } from './PieceGlyph'

const PROMOTION_PIECES = ['q', 'r', 'b', 'n']

// Overlay row of 4 piece choices; the player must pick one (UI-SPEC: "the
// player must choose" — there is no default).
export function PromotionPicker({ color, onSelect, onCancel }) {
  return (
    <div className="promotion-backdrop" onClick={onCancel}>
      <div className="promotion-picker" onClick={(e) => e.stopPropagation()}>
        {PROMOTION_PIECES.map((piece) => (
          <button
            key={piece}
            type="button"
            className="promotion-choice"
            aria-label={`Promote to ${piece}`}
            onClick={() => onSelect(piece)}
          >
            <PieceGlyph pieceType={piece} isWhite={color === 'w'} />
          </button>
        ))}
      </div>
    </div>
  )
}
