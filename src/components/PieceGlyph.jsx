import { PIECE_GLYPHS } from '../lib/pieceGlyphs'
import { PicketSign } from './PicketSign'
import { PieceStatusIcon } from './PieceStatusIcon'

// A container needs to be a different element than the one using its query
// units (an element can't size itself off its own container). The outer div
// establishes the container at the square's actual pixel size; the inner
// div's font-size reads it back via cqi, so "72%" means 72% of the square,
// not 72% of the (arbitrary, inherited) ambient font-size.
const CONTAINER_STYLE = {
  position: 'relative',
  width: '100%',
  height: '100%',
  containerType: 'inline-size',
}

const GLYPH_STYLE_BASE = {
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  fontFamily: '"Noto Sans Symbols 2", "Segoe UI Symbol", serif',
  fontSize: '72cqi',
  lineHeight: 1,
  fontVariantEmoji: 'text',
  userSelect: 'none',
}

// badge: null | { type: 'picket' } (striking pawns) | { type: 'icon', src,
// sizePercent } (work-to-rule bishops, sitting-out rooks).
// offset: null | { x, y } in px, from useGlyphOffsets -- nudges the glyph so
// its actual ink sits at the square's centre instead of the font's layout
// centre.
export function PieceGlyph({ pieceType, isWhite, badge = null, shake = false, offset = null }) {
  const transform = offset ? `translate(${offset.x}px, ${offset.y}px)` : undefined
  return (
    <div className={shake ? 'piece-shake' : undefined} style={CONTAINER_STYLE}>
      <div
        style={
          isWhite
            ? {
                ...GLYPH_STYLE_BASE,
                color: 'var(--panel)',
                WebkitTextStroke: '1.5px var(--ink)',
                paintOrder: 'stroke fill',
                transform,
              }
            : { ...GLYPH_STYLE_BASE, color: 'var(--ink)', transform }
        }
      >
        {PIECE_GLYPHS[pieceType]}
      </div>
      {badge?.type === 'picket' ? <PicketSign /> : null}
      {badge?.type === 'icon' ? (
        <PieceStatusIcon src={badge.src} sizePercent={badge.sizePercent} />
      ) : null}
    </div>
  )
}
