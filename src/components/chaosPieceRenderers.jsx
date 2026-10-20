import { PIECE_GLYPHS } from '../lib/pieceGlyphs'
import { ChaosPieceGlyph } from './ChaosPieceGlyph'

// Chaos Mode's equivalent of pieceRenderers.jsx's buildPieceRenderers --
// kept separate so classic mode's renderer file never changes.
export function buildChaosPieceRenderers(chaos, shakingSquare, glyphOffsets, refusalSquare) {
  const renderers = {}
  for (const pieceType of Object.keys(PIECE_GLYPHS)) {
    renderers[`w${pieceType.toUpperCase()}`] = ({ square } = {}) => (
      <ChaosPieceGlyph
        pieceType={pieceType}
        isWhite={true}
        piece={chaos.piecesById[chaos.bySquare[square]]}
        shake={square === shakingSquare}
        refusing={square === refusalSquare}
        offset={glyphOffsets?.[`w${pieceType}`]}
      />
    )
    renderers[`b${pieceType.toUpperCase()}`] = ({ square } = {}) => (
      <ChaosPieceGlyph
        pieceType={pieceType}
        isWhite={false}
        piece={chaos.piecesById[chaos.bySquare[square]]}
        shake={square === shakingSquare}
        refusing={square === refusalSquare}
        offset={glyphOffsets?.[`b${pieceType}`]}
      />
    )
  }
  return renderers
}
