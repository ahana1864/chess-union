import { PIECE_GLYPHS } from '../lib/pieceGlyphs'
import { PieceGlyph } from './PieceGlyph'

// Striking pawns get a picket sign; a bishop working to rule gets the anger
// icon; a rook sitting out gets the zzz icon. Knights are never badged --
// they feed the minors union's grievance but aren't themselves restricted.
function badgeFor(pieceType, side, unions) {
  if (pieceType === 'p' && unions[side].pawns.status === 'strike') {
    return { type: 'picket' }
  }
  if (pieceType === 'b' && unions[side].minors.status === 'strike') {
    return { type: 'icon', src: '/icons/anger.png', sizePercent: 40 }
  }
  if (pieceType === 'r' && unions[side].rooks.status === 'strike') {
    return { type: 'icon', src: '/icons/zzz.png', sizePercent: 45 }
  }
  return null
}

// Rebuilt each render with the current union state so striking pieces pick
// up their badge, and the square the player just tried (and failed) to
// move from gets the shake animation. glyphOffsets comes from
// useGlyphOffsets and may still be null on the very first render, before
// fonts finish loading.
export function buildPieceRenderers(unions, shakingSquare, glyphOffsets) {
  const renderers = {}
  for (const pieceType of Object.keys(PIECE_GLYPHS)) {
    renderers[`w${pieceType.toUpperCase()}`] = ({ square } = {}) => (
      <PieceGlyph
        pieceType={pieceType}
        isWhite={true}
        badge={badgeFor(pieceType, 'white', unions)}
        shake={square === shakingSquare}
        offset={glyphOffsets?.[`w${pieceType}`]}
      />
    )
    renderers[`b${pieceType.toUpperCase()}`] = ({ square } = {}) => (
      <PieceGlyph
        pieceType={pieceType}
        isWhite={false}
        badge={badgeFor(pieceType, 'black', unions)}
        shake={square === shakingSquare}
        offset={glyphOffsets?.[`b${pieceType}`]}
      />
    )
  }
  return renderers
}
