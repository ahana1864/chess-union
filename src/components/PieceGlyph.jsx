import { PIECE_GLYPHS } from '../lib/pieceGlyphs'
import { PicketSign } from './PicketSign'

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

export function PieceGlyph({ pieceType, isWhite, onStrike = false, shake = false }) {
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
              }
            : { ...GLYPH_STYLE_BASE, color: 'var(--ink)' }
        }
      >
        {PIECE_GLYPHS[pieceType]}
      </div>
      {onStrike ? <PicketSign /> : null}
    </div>
  )
}
