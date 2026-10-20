import { PIECE_GLYPHS } from '../lib/pieceGlyphs'
import { iconUrl } from '../lib/assetPath'
import { PieceGlyph } from './PieceGlyph'

// Striking pawns get a picket sign; a bishop working to rule or a sitting-
// out rook gets its icon. restrictedSet is the combined (both sides)
// restrictedSquares() list from src/lib/boardInfo.js -- the same list a
// test can check directly -- so a piece is badged exactly when its square
// is in that list, not by re-deriving the condition here.
function badgeFor(pieceType, square, side, unions, restrictedSet) {
  if (pieceType === 'p' && unions[side].pawns.status === 'strike') {
    return { type: 'picket' }
  }
  if (pieceType === 'b' && restrictedSet.has(square)) {
    return { type: 'icon', src: iconUrl('anger.png'), sizePercent: 40 }
  }
  if (pieceType === 'r' && restrictedSet.has(square)) {
    return { type: 'icon', src: iconUrl('zzz.png'), sizePercent: 45 }
  }
  return null
}

// Rebuilt each render with the current union state so striking pieces pick
// up their badge, and the square the player just tried (and failed) to
// move from gets the shake animation. glyphOffsets comes from
// useGlyphOffsets and may still be null on the very first render, before
// fonts finish loading.
export function buildPieceRenderers(unions, shakingSquare, glyphOffsets, restrictedSet) {
  const renderers = {}
  for (const pieceType of Object.keys(PIECE_GLYPHS)) {
    renderers[`w${pieceType.toUpperCase()}`] = ({ square } = {}) => (
      <PieceGlyph
        pieceType={pieceType}
        isWhite={true}
        badge={badgeFor(pieceType, square, 'white', unions, restrictedSet)}
        shake={square === shakingSquare}
        offset={glyphOffsets?.[`w${pieceType}`]}
      />
    )
    renderers[`b${pieceType.toUpperCase()}`] = ({ square } = {}) => (
      <PieceGlyph
        pieceType={pieceType}
        isWhite={false}
        badge={badgeFor(pieceType, square, 'black', unions, restrictedSet)}
        shake={square === shakingSquare}
        offset={glyphOffsets?.[`b${pieceType}`]}
      />
    )
  }
  return renderers
}
