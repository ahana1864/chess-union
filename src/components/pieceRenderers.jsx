import { PIECE_GLYPHS } from '../lib/pieceGlyphs'
import { PieceGlyph } from './PieceGlyph'

// Rebuilt each render with the current union state so striking pawns pick
// up a picket sign, and the square the player just tried (and failed) to
// move from gets the shake animation.
export function buildPieceRenderers(unions, shakingSquare) {
  const renderers = {}
  for (const pieceType of Object.keys(PIECE_GLYPHS)) {
    renderers[`w${pieceType.toUpperCase()}`] = ({ square } = {}) => (
      <PieceGlyph
        pieceType={pieceType}
        isWhite={true}
        onStrike={pieceType === 'p' && unions.white.pawns.status === 'strike'}
        shake={square === shakingSquare}
      />
    )
    renderers[`b${pieceType.toUpperCase()}`] = ({ square } = {}) => (
      <PieceGlyph
        pieceType={pieceType}
        isWhite={false}
        onStrike={pieceType === 'p' && unions.black.pawns.status === 'strike'}
        shake={square === shakingSquare}
      />
    )
  }
  return renderers
}
